import { IsNotEmpty, IsString } from "class-validator";


export class ChangePhoneDto {
    @IsString()
    @IsNotEmpty()
    newPhone: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}