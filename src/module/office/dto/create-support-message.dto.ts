import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class CreateSupportMessageDto {
  @ApiProperty({ example: 'John Doe', description: 'Name of the person sending the message' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+966501234567', description: 'Phone number' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, {
    message: 'Phone number is not valid',
  })
  phone: string;

  @ApiProperty({ description: 'Support message content' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  message: string;
}
