import { IsNotEmpty, IsString } from 'class-validator';

export class AddEmployeeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  phone: string;
  
  @IsString()
  roleInOffice: string;
}
