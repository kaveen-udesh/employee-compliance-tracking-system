import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { parseDateOnly, resolveUpdatedStatus, toDateOnly } from '../common/dates';
import { ComplianceEventsService } from '../events/compliance-events.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateComplianceRecordDto } from './dto/create-compliance-record.dto';
import { EvaluateComplianceRecordDto } from './dto/evaluate-compliance-record.dto';
import { ListComplianceRecordsQuery } from './dto/list-compliance-records.query';
import { UpdateComplianceRecordDto } from './dto/update-compliance-record.dto';

const recordInclude = {
  employee: true,
} satisfies Prisma.ComplianceRecordInclude;

@Injectable()
export class ComplianceRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: ComplianceEventsService,
  ) {}

  async create(dto: CreateComplianceRecordDto) {
    await this.assertEmployee(dto.employeeId);
    const status = resolveUpdatedStatus(dto.issuedDate, dto.expiryDate);
    const record = await this.prisma.complianceRecord.create({
      data: {
        employeeId: dto.employeeId,
        type: dto.type,
        issuedDate: parseDateOnly(dto.issuedDate),
        expiryDate: parseDateOnly(dto.expiryDate),
        status,
        notes: dto.notes,
        documentUrl: dto.documentUrl,
      },
      include: recordInclude,
    });
    this.events.notify('created');
    return record;
  }

  async findAll(query: ListComplianceRecordsQuery) {
    const where: Prisma.ComplianceRecordWhereInput = {};

    const archivedMode =
      query.archived ?? (query.includeArchived ? 'include' : 'hide');
    if (archivedMode === 'only') {
      where.archivedAt = { not: null };
    } else if (archivedMode !== 'include') {
      where.archivedAt = null;
    }
    if (query.employeeId) {
      where.employeeId = query.employeeId;
    }
    if (query.status?.length) {
      where.status = { in: query.status };
    }
    if (query.type?.length) {
      where.type = { in: query.type };
    }
    if (query.department) {
      where.employee = { department: query.department };
    }
    if (query.q) {
      where.OR = [
        { notes: { contains: query.q } },
        { employee: { fullName: { contains: query.q } } },
        { employee: { email: { contains: query.q } } },
      ];
    }

    return this.prisma.complianceRecord.findMany({
      where,
      include: recordInclude,
      orderBy: [{ expiryDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string, includeArchived = true) {
    const record = await this.prisma.complianceRecord.findUnique({
      where: { id },
      include: recordInclude,
    });
    if (!record || (!includeArchived && record.archivedAt)) {
      throw new NotFoundException(`Compliance record ${id} was not found`);
    }
    return record;
  }

  async update(id: string, dto: UpdateComplianceRecordDto) {
    const existing = await this.findOne(id, false);
    const issuedDate = dto.issuedDate ?? toDateOnly(existing.issuedDate);
    const expiryDate = dto.expiryDate ?? toDateOnly(existing.expiryDate);
    if (toDateOnly(expiryDate) <= toDateOnly(issuedDate)) {
      throw new BadRequestException('expiryDate must be after issuedDate');
    }

    const datesChanged = Boolean(dto.issuedDate || dto.expiryDate);
    const status = resolveUpdatedStatus(
      issuedDate,
      expiryDate,
      existing.status,
      datesChanged,
    );

    const record = await this.prisma.complianceRecord.update({
      where: { id },
      data: {
        type: dto.type,
        issuedDate: dto.issuedDate ? parseDateOnly(dto.issuedDate) : undefined,
        expiryDate: dto.expiryDate ? parseDateOnly(dto.expiryDate) : undefined,
        notes: dto.notes,
        documentUrl: dto.documentUrl,
        status,
        lastAlertFingerprint: datesChanged ? null : undefined,
      },
      include: recordInclude,
    });
    this.events.notify('updated');
    return record;
  }

  async remove(id: string, hard = false) {
    const existing = await this.findOne(id);
    if (hard) {
      const deleted = await this.prisma.complianceRecord.delete({
        where: { id },
      });
      this.events.notify('deleted');
      return deleted;
    }
    if (existing.archivedAt) {
      return existing;
    }
    const archived = await this.prisma.complianceRecord.update({
      where: { id },
      data: { archivedAt: new Date() },
      include: recordInclude,
    });
    this.events.notify('archived');
    return archived;
  }

  async evaluate(id: string, dto: EvaluateComplianceRecordDto) {
    const existing = await this.findOne(id, false);
    if (existing.lastAlertFingerprint === dto.fingerprint) {
      return {
        changed: false,
        previousStatus: existing.status,
        record: existing,
      };
    }

    const record = await this.prisma.complianceRecord.update({
      where: { id },
      data: {
        status: dto.status,
        lastAlertFingerprint: dto.fingerprint,
      },
      include: recordInclude,
    });

    const changed = existing.status !== dto.status;
    if (changed) {
      this.events.notify('evaluated');
    }
    return {
      changed,
      previousStatus: existing.status,
      record,
    };
  }

  private async assertEmployee(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) {
      throw new NotFoundException(`Employee ${employeeId} was not found`);
    }
  }
}
