import { IsEmail, IsString } from "class-validator";


export class UpdateProfileDto {
    @IsString()
    name: string;

    @IsString()
    @IsEmail()
    email: string;
}