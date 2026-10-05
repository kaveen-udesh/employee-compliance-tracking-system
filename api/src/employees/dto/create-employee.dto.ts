import { IsEmail, IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { DEPARTMENTS, Department } from '../../common/constants';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName: string;

  @IsEmail()
  email: string;

  @IsIn(DEPARTMENTS)
  department: Department;
}
