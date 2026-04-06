import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class TypingDto {
  @ApiProperty({ example: '1001' })
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isTyping: boolean;
}
