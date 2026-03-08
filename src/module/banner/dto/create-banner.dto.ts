import { IsString, IsOptional, IsInt, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBannerDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Image file for the category icon',
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  imagePath?: Express.Multer.File | string;

  @IsString()
  @IsOptional()
  link?: string;
}