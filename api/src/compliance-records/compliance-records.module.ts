import { Module } from '@nestjs/common';
import { ComplianceRecordsController } from './compliance-records.controller';
import { ComplianceRecordsService } from './compliance-records.service';

@Module({
  controllers: [ComplianceRecordsController],
  providers: [ComplianceRecordsService],
})
export class ComplianceRecordsModule {}
