import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyPasswordResetOtpDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    emailOrPhone: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    otp: string;
}
