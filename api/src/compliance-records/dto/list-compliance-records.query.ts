import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  COMPLIANCE_STATUSES,
  COMPLIANCE_TYPES,
  DEPARTMENTS,
} from '../../common/constants';

const toList = ({ value }: { value: unknown }) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return value;
};

const toBoolean = ({ value }: { value: unknown }) => {
  if (value === true || value === 'true' || value === '1') {
    return true;
  }
  if (value === false || value === 'false' || value === '0') {
    return false;
  }
  return value;
};

export class ListComplianceRecordsQuery {
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @Transform(toList)
  @IsIn(COMPLIANCE_STATUSES, { each: true })
  status?: string[];

  @IsOptional()
  @Transform(toList)
  @IsIn(COMPLIANCE_TYPES, { each: true })
  type?: string[];

  @IsOptional()
  @IsIn(DEPARTMENTS)
  department?: string;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  includeArchived?: boolean;

  @IsOptional()
  @IsIn(['hide', 'include', 'only'])
  archived?: 'hide' | 'include' | 'only';

  @IsOptional()
  @IsString()
  q?: string;
}
