import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { COMPLIANCE_TYPES, ComplianceType } from '../../common/constants';
import { ExpiryAfterIssued } from '../../common/expiry-after-issued.validator';

export class CreateComplianceRecordDto {
  @IsUUID()
  employeeId: string;

  @IsIn(COMPLIANCE_TYPES)
  type: ComplianceType;

  @IsDateString()
  issuedDate: string;

  @IsDateString()
  @ExpiryAfterIssued()
  expiryDate: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  documentUrl?: string;
}
