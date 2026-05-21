import { IsNotEmpty, IsString } from "class-validator";

export class ReplySupportMessageDto{
    @IsNotEmpty()
    @IsString()
    message : string;
}