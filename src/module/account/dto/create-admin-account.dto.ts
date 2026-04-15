import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsString, MinLength } from 'class-validator';

export class CreateAdminAccountDto {
    @ApiProperty({ example: 'https://example.com/profile.jpg', required: false })
    @IsString()
    @IsNotEmpty()
    profilePicture?: string;

    @ApiProperty({ example: 'admin@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'John Doe' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'en' })
    @IsString()
    @IsNotEmpty()
    language: string;

    @ApiProperty({ example: '20123456789' })
    @IsString()
    @IsNotEmpty()
    phone: string;

    @ApiProperty({ example: 'Admin@12345' })
    @IsString()
    @MinLength(8)
    password: string;

    @ApiProperty({ example: 1, description: 'Admin role ID from admin_roles table' })
    @IsNumber()
    @IsNotEmpty()
    adminRoleId: number;
}
