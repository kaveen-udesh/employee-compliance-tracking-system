import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ComplianceRecordsModule } from './compliance-records/compliance-records.module';
import { EmployeesModule } from './employees/employees.module';
import { HealthController } from './health.controller';
import { EventsModule } from './events/events.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventsModule,
    PrismaModule,
    EmployeesModule,
    ComplianceRecordsModule,
    ReportsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
