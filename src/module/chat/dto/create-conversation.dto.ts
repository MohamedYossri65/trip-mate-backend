import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({ description: 'Booking id linked to this direct conversation', example: '1001' })
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({ description: 'Office owner account id for this booking offer', example: '55' })
  @IsString()
  @IsNotEmpty()
  officeAccountId: string;
}
