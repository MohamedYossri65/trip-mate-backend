import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { AddEmployeeDto } from './add-employee.dto';

export class AddOfficeEmployeesDto {
  @ApiProperty({ type: [AddEmployeeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddEmployeeDto)
  employees: AddEmployeeDto[];
}
