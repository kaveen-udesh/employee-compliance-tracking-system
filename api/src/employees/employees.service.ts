import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { ListEmployeesQuery } from './dto/list-employees.query';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmployeeDto) {
    try {
      return await this.prisma.employee.create({ data: dto });
    } catch (error) {
      this.rethrowUniqueEmail(error);
      throw error;
    }
  }

  findAll(query: ListEmployeesQuery = {}) {
    const where: Prisma.EmployeeWhereInput = {};
    if (query.department) {
      where.department = query.department;
    }
    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { fullName: { contains: q } },
        { email: { contains: q } },
      ];
    }

    return this.prisma.employee.findMany({
      where,
      orderBy: { fullName: 'asc' },
      include: {
        _count: { select: { records: true } },
      },
    });
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        records: {
          where: { archivedAt: null },
          orderBy: { expiryDate: 'asc' },
        },
      },
    });
    if (!employee) {
      throw new NotFoundException(`Employee ${id} was not found`);
    }
    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findOne(id);
    try {
      return await this.prisma.employee.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      this.rethrowUniqueEmail(error);
      throw error;
    }
  }

  async remove(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { _count: { select: { records: true } } },
    });
    if (!employee) {
      throw new NotFoundException(`Employee ${id} was not found`);
    }
    if (employee._count.records > 0) {
      throw new ConflictException(
        'Cannot delete an employee who still has compliance records',
      );
    }
    return this.prisma.employee.delete({ where: { id } });
  }

  private rethrowUniqueEmail(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('An employee with this email already exists');
    }
  }
}
