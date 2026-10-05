import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  COMPLIANCE_STATUSES,
  COMPLIANCE_TYPES,
  DEPARTMENTS,
  DEFAULT_EXPIRING_SOON_DAYS,
} from '../common/constants';
import { addUtcDays, parseDateOnly, toDateOnly, utcToday } from '../common/dates';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardReportQuery } from './dto/dashboard-report.query';

type StatusCounts = Record<(typeof COMPLIANCE_STATUSES)[number], number> & {
  total: number;
};

const emptyCounts = (): StatusCounts => ({
  active: 0,
  expiring: 0,
  expired: 0,
  renewed: 0,
  total: 0,
});

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getDashboard(query: DashboardReportQuery) {
    const window = this.resolveWindow(query);
    const [liveRecords, archivedCount, expiringSoon] = await Promise.all([
      this.prisma.complianceRecord.findMany({
        where: { archivedAt: null },
        include: { employee: true },
      }),
      this.prisma.complianceRecord.count({
        where: { archivedAt: { not: null } },
      }),
      this.prisma.complianceRecord.findMany({
        where: {
          archivedAt: null,
          expiryDate: {
            gte: parseDateOnly(window.from),
            lte: parseDateOnly(window.to),
          },
        },
        include: { employee: true },
        orderBy: { expiryDate: 'asc' },
      }),
    ]);

    const totals = emptyCounts();
    const byDepartment = Object.fromEntries(
      DEPARTMENTS.map((department) => [department, emptyCounts()]),
    );
    const byType = Object.fromEntries(
      COMPLIANCE_TYPES.map((type) => [type, emptyCounts()]),
    );

    for (const record of liveRecords) {
      this.bump(totals, record.status);
      this.bump(byDepartment[record.employee.department], record.status);
      this.bump(byType[record.type], record.status);
    }

    return {
      generatedAt: new Date().toISOString(),
      strategy: 'live',
      window,
      totals: {
        ...totals,
        archived: archivedCount,
      },
      byDepartment: DEPARTMENTS.map((department) => ({
        department,
        ...byDepartment[department],
      })),
      byType: COMPLIANCE_TYPES.map((type) => ({
        type,
        ...byType[type],
      })),
      expiringSoon: expiringSoon.map((record) => ({
        ...record,
        issuedDate: toDateOnly(record.issuedDate),
        expiryDate: toDateOnly(record.expiryDate),
      })),
    };
  }

  private resolveWindow(query: DashboardReportQuery) {
    const today = utcToday();
    if ((query.from && !query.to) || (!query.from && query.to)) {
      throw new BadRequestException('from and to must be provided together');
    }
    if (query.from && query.to) {
      if (toDateOnly(query.to) < toDateOnly(query.from)) {
        throw new BadRequestException('to must be on or after from');
      }
      return {
        from: toDateOnly(query.from),
        to: toDateOnly(query.to),
        days: query.days ?? null,
      };
    }
    const days =
      query.days ??
      this.config.get<number>('EXPIRING_SOON_DAYS') ??
      DEFAULT_EXPIRING_SOON_DAYS;
    return {
      from: today,
      to: addUtcDays(today, Number(days)),
      days: Number(days),
    };
  }

  private bump(bucket: StatusCounts, status: string) {
    if (status in bucket) {
      bucket[status as keyof StatusCounts] += 1;
    }
    bucket.total += 1;
  }
}
