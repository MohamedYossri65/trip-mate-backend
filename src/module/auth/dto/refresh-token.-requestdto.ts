import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class RefreshTokenRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  sessionId: bigint;

  @ApiProperty()
  @IsNotEmpty()
  refreshToken: string;
}
