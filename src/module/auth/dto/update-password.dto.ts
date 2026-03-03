import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdatePasswordDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    currentPassword: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    newPassword: string;
}
