import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { COMPLIANCE_TYPES, ComplianceType } from '../../common/constants';
import { ExpiryAfterIssued } from '../../common/expiry-after-issued.validator';

export class UpdateComplianceRecordDto {
  @IsOptional()
  @IsIn(COMPLIANCE_TYPES)
  type?: ComplianceType;

  @IsOptional()
  @IsDateString()
  issuedDate?: string;

  @IsOptional()
  @IsDateString()
  @ExpiryAfterIssued()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  documentUrl?: string;
}
