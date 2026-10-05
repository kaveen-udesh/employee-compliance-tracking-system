import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { COMPLIANCE_STATUSES, ComplianceStatus } from '../../common/constants';

export class EvaluateComplianceRecordDto {
  @IsIn(COMPLIANCE_STATUSES)
  status: ComplianceStatus;

  @IsString()
  @IsNotEmpty()
  fingerprint: string;
}
