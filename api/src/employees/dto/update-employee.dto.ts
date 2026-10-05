import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { DEPARTMENTS, Department } from '../../common/constants';

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsIn(DEPARTMENTS)
  department?: Department;
}
