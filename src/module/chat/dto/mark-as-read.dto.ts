import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MarkAsReadDto {
  @ApiProperty({ example: '1001' })
  @IsString()
  @IsNotEmpty()
  conversationId: string;
}
