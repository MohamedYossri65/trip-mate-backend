import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/auth.guard';
import { CurrentUser } from 'src/common/guards/decorators/user.decorator';
import { Account } from '../account/entity/account.entity';
import { WalletService } from './wallet.service';
import { WithdrawDto } from './dto/withdraw.dto';
import { Auth } from 'src/common/guards/decorators/auth.decorator';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { WithdrawRequestsQueryDto } from './dto/withdraw-requests-query.dto';
import { RejectWithdrawalDto } from './dto/reject-withdrawal.dto';

@ApiTags('wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'wallet', version: '1' })
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @Auth(RolesEnum.OFFICE)
  @ApiOperation({ summary: 'Get wallet summary (available + pending balances and recent transactions)' })
  async getWalletSummary(@CurrentUser() account: Account) {
    return this.walletService.getWalletSummary(account.id);
  }

  @Post('withdraw')
  @Auth(RolesEnum.OFFICE)
  @ApiOperation({ summary: 'Create withdrawal request (pending admin approval)' })
  async withdraw(
    @CurrentUser() account: Account,
    @Body() dto: WithdrawDto,
  ) {
    return this.walletService.requestWithdrawal(account.id, dto);
  }

  @Get('withdraw/requests/:transactionId')
  @Auth(RolesEnum.OFFICE, RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Get one withdrawal request by id (office sees own, admin sees any)' })
  async getWithdrawalRequestById(
    @CurrentUser() account: Account,
    @Param('transactionId') transactionId: string,
  ) {
    return this.walletService.getWithdrawalRequestById(account, transactionId);
  }

  @Get('withdraw/requests')
  @Auth(RolesEnum.OFFICE, RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Get withdrawal requests with pagination (office sees own, admin sees all)' })
  async listWithdrawalRequests(
    @CurrentUser() account: Account,
    @Query() query: WithdrawRequestsQueryDto,
  ) {
    return this.walletService.listWithdrawalRequests(account, query);
  }

  @Post('withdraw/:transactionId/approve')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Approve pending withdrawal request (admin only)' })
  async approveWithdrawal(@Param('transactionId') transactionId: string) {
    return this.walletService.approveWithdrawal(transactionId);
  }

  @Post('withdraw/:transactionId/reject')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Reject pending withdrawal request with reason (admin only)' })
  async rejectWithdrawal(
    @Param('transactionId') transactionId: string,
    @Body() dto: RejectWithdrawalDto,
  ) {
    return this.walletService.rejectWithdrawal(transactionId, dto.reason);
  }

  @Post('withdraw/:transactionId/cancel')
  @Auth(RolesEnum.OFFICE)
  @ApiOperation({ summary: 'Cancel pending withdrawal request (office only)' })
  async cancelWithdrawal(
    @CurrentUser() account: Account,
    @Param('transactionId') transactionId: string,
  ) {
    return this.walletService.cancelWithdrawal(account.id, transactionId);
  }
}
