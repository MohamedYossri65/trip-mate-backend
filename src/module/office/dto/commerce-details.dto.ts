import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CommerceDetailsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  commerceNumber: string;

  @ApiProperty({ type: 'string', format: 'binary' })
  @IsOptional()
  taxCertificate: Express.Multer.File | string; // Accept either file upload or existing URL
}
