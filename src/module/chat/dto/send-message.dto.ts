import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { MessageType } from '../enums/chat.enums';
import { BookingType } from 'src/module/bookings/domain/enum/booking-type.enum';

export class OfferMessageDetailsDto {

  @IsNumber()
  offerId: bigint;

  @IsEnum(BookingType)
  bookingType: BookingType;

  @ApiProperty({ example: '2026-04-03T10:30:00.000Z' })
  @IsDateString()
  createdAt: string;

  @ApiProperty({ example: 250.5 })
  @IsNumber()
  @Min(0)
  offerPrice: number;
}

export class SendMessageDto {
  @ApiProperty({ example: '1001' })
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @ApiPropertyOptional({ example: 'Hello from websocket!' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  content?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/chat/file.pdf' })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @ApiPropertyOptional({ enum: MessageType, default: MessageType.TEXT })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @ApiPropertyOptional({
    example: 12,
    description: 'Audio duration in seconds. Required when type is AUDIO.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  audioDurationSec?: number;

  @ApiPropertyOptional({
    description: 'Required when type is OFFER.',
    type: OfferMessageDetailsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OfferMessageDetailsDto)
  offerDetails?: OfferMessageDetailsDto;
}
