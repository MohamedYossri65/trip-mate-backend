import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { WalletTransactionStatus } from '../enum/wallet-transaction-status.enum';

export class WithdrawRequestsQueryDto extends PaginationDto {
	@ApiPropertyOptional({ description: 'Search by office name' })
	@IsOptional()
	@IsString()
	search?: string;

	@ApiPropertyOptional({ enum: WalletTransactionStatus, description: 'Filter by request status' })
	@IsOptional()
	@IsEnum(WalletTransactionStatus)
	status?: WalletTransactionStatus;

	@ApiPropertyOptional({ description: 'Filter created_at from date (ISO string)' })
	@IsOptional()
	@IsDateString()
	dateFrom?: string;

	@ApiPropertyOptional({ description: 'Filter created_at to date (ISO string)' })
	@IsOptional()
	@IsDateString()
	dateTo?: string;
}
