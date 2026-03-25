import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";


export class ChangeOfficeDataRequestDto {
    @IsString()
    officeName: string;

    @IsString()
    phoneNumber: string;

    @IsString()
    email: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    commerceNumber: string;

    @ApiProperty({ type: 'string', format: 'binary' })
    @IsOptional()
    commerceCertificate: Express.Multer.File | string;

    @ApiProperty({ type: 'string', format: 'binary' })
    @IsOptional()
    taxCertificate: Express.Multer.File | string;
}