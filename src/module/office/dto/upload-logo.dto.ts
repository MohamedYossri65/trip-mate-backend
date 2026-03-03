import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class UploadLogoDto {
    @ApiProperty({ type: 'string', format: 'binary' })
    @IsOptional()
    logo: Express.Multer.File;
}