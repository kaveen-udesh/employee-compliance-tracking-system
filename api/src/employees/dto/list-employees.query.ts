import { IsIn, IsOptional, IsString } from 'class-validator';
import { DEPARTMENTS } from '../../common/constants';

export class ListEmployeesQuery {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(DEPARTMENTS)
  department?: string;
}
