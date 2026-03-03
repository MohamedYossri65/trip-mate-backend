import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    resetToken: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    newPassword: string;
}
