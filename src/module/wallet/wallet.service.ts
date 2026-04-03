import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OfficeWallet } from './entity/office-wallet.entity';
import { WalletTransaction } from './entity/wallet-transaction.entity';
import { WalletTransactionType } from './enum/wallet-transaction-type.enum';
import { WalletTransactionStatus } from './enum/wallet-transaction-status.enum';
import { WithdrawDto } from './dto/withdraw.dto';
import { Account } from '../account/entity/account.entity';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { WithdrawRequestsQueryDto } from './dto/withdraw-requests-query.dto';

const HOLD_PERIOD_DAYS = 7;

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectRepository(OfficeWallet)
    private readonly walletRepo: Repository<OfficeWallet>,
    @InjectRepository(WalletTransaction)
    private readonly txRepo: Repository<WalletTransaction>,
  ) {}

  // ─── GET OR CREATE WALLET ──────────────────────────────────────────

  async getOrCreateWallet(officeAccountId: bigint): Promise<OfficeWallet> {
    let wallet = await this.walletRepo.findOne({
      where: { officeAccountId },
    });

    if (!wallet) {
      wallet = this.walletRepo.create({
        officeAccountId,
        availableBalance: 0,
        pendingBalance: 0,
      });
      wallet = await this.walletRepo.save(wallet);
      this.logger.log(`Created wallet for office account ${officeAccountId}`);
    }

    return wallet;
  }

  // ─── CREDIT PENDING ───────────────────────────────────────────────

  async creditPending(
    officeAccountId: bigint,
    amount: number,
    bookingId: bigint,
  ): Promise<WalletTransaction> {
    const wallet = await this.getOrCreateWallet(officeAccountId);

    const releasableAt = new Date();
    releasableAt.setDate(releasableAt.getDate() + HOLD_PERIOD_DAYS);

    // Update pending balance
    wallet.pendingBalance = Number(wallet.pendingBalance) + amount;
    await this.walletRepo.save(wallet);

    // Create pending transaction
    const tx = this.txRepo.create({
      walletId: wallet.id,
      type: WalletTransactionType.CREDIT_PENDING,
      status: WalletTransactionStatus.PENDING,
      amount,
      bookingId,
      releasableAt,
    });

    const savedTx = await this.txRepo.save(tx);

    this.logger.log(
      `Credited ${amount} SAR to pending balance for office ${officeAccountId}, booking ${bookingId}. Releasable at ${releasableAt.toISOString()}`,
    );

    return savedTx;
  }

  // ─── RELEASE PENDING FUNDS (CRON) ─────────────────────────────────

  @Cron(CronExpression.EVERY_HOUR)
  async releasePendingFunds(): Promise<void> {
    const now = new Date();

    const pendingTransactions = await this.txRepo.find({
      where: {
        status: WalletTransactionStatus.PENDING,
        releasableAt: LessThanOrEqual(now),
      },
      relations: ['wallet'],
    });

    if (!pendingTransactions.length) {
      return;
    }

    this.logger.log(`Releasing ${pendingTransactions.length} pending transactions`);

    for (const tx of pendingTransactions) {
      const wallet = tx.wallet;
      const amount = Number(tx.amount);

      // Move from pending to available
      wallet.pendingBalance = Number(wallet.pendingBalance) - amount;
      wallet.availableBalance = Number(wallet.availableBalance) + amount;
      await this.walletRepo.save(wallet);

      // Update transaction status
      tx.status = WalletTransactionStatus.RELEASED;
      tx.releasedAt = now;
      await this.txRepo.save(tx);

      // Create a RELEASE transaction for the audit trail
      const releaseTx = this.txRepo.create({
        walletId: wallet.id,
        type: WalletTransactionType.RELEASE,
        status: WalletTransactionStatus.RELEASED,
        amount,
        bookingId: tx.bookingId,
        releasedAt: now,
      });
      await this.txRepo.save(releaseTx);

      this.logger.log(
        `Released ${amount} SAR for wallet ${wallet.id} (office ${wallet.officeAccountId})`,
      );
    }
  }

  // ─── WALLET SUMMARY ───────────────────────────────────────────────

  async getWalletSummary(officeAccountId: bigint) {
    const wallet = await this.getOrCreateWallet(officeAccountId);

    const withdrawnTotalResult = await this.txRepo
      .createQueryBuilder('tx')
      .select('COALESCE(SUM(tx.amount), 0)', 'total')
      .where('tx.wallet_id = :walletId', { walletId: wallet.id })
      .andWhere('tx.type = :type', { type: WalletTransactionType.WITHDRAWAL })
      .andWhere('tx.status = :status', { status: WalletTransactionStatus.WITHDRAWN })
      .getRawOne<{ total: string | number }>();

    const withdrawnTotal = Number(withdrawnTotalResult?.total ?? 0);
    const totalProfitSinceJoining =
      Number(wallet.availableBalance) + Number(wallet.pendingBalance) + withdrawnTotal;

    return {
      id: wallet.id,
      availableBalance: Number(wallet.availableBalance),
      pendingBalance: Number(wallet.pendingBalance),
      currency: wallet.currency,
      totalProfitSinceJoining,
    };
  }

  // ─── WITHDRAWAL ───────────────────────────────────────────────────

  async requestWithdrawal(officeAccountId: bigint, dto: WithdrawDto) {
    const { amount, taxInvoiceAttachment, notes } = dto;

    if (amount <= 0) {
      throw new BadRequestException('Withdrawal amount must be greater than zero');
    }

    const wallet = await this.walletRepo.findOne({
      where: { officeAccountId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const available = Number(wallet.availableBalance);
    if (amount > available) {
      throw new BadRequestException(
        `Insufficient available balance. Available: ${available} SAR, Requested: ${amount} SAR`,
      );
    }

    // Create a pending withdrawal request; admin approval will finalize deduction.
    const tx = this.txRepo.create({
      walletId: wallet.id,
      type: WalletTransactionType.WITHDRAWAL,
      status: WalletTransactionStatus.PENDING,
      amount,
      taxInvoiceAttachment,
      notes,
    });
    const savedTx = await this.txRepo.save(tx);

    this.logger.log(
      `Withdrawal request created: amount=${amount} SAR, wallet=${wallet.id}, office=${officeAccountId}`,
    );

    return {
      transactionId: savedTx.id,
      requestedAmount: amount,
      status: savedTx.status,
      availableBalance: Number(wallet.availableBalance),
    };
  }

  async approveWithdrawal(transactionIdRaw: string) {
    const transactionId = this.toBigInt(transactionIdRaw, 'transactionId');

    const pendingTx = await this.txRepo.findOne({
      where: {
        id: transactionId,
        type: WalletTransactionType.WITHDRAWAL,
        status: WalletTransactionStatus.PENDING,
      },
      relations: ['wallet'],
    });

    if (!pendingTx) {
      throw new NotFoundException('Pending withdrawal request not found');
    }

    const wallet = pendingTx.wallet;
    const amount = Number(pendingTx.amount);
    const available = Number(wallet.availableBalance);

    if (amount > available) {
      throw new BadRequestException(
        `Insufficient available balance at approval time. Available: ${available} SAR, Requested: ${amount} SAR`,
      );
    }

    wallet.availableBalance = available - amount;
    pendingTx.status = WalletTransactionStatus.WITHDRAWN;
    pendingTx.releasedAt = new Date();

    await this.walletRepo.manager.transaction(async (manager) => {
      await manager.getRepository(OfficeWallet).save(wallet);
      await manager.getRepository(WalletTransaction).save(pendingTx);
    });

    this.logger.log(
      `Withdrawal approved: transaction=${transactionId}, amount=${amount} SAR, wallet=${wallet.id}`,
    );

    return {
      transactionId: pendingTx.id,
      approvedAmount: amount,
      status: pendingTx.status,
      remainingAvailableBalance: Number(wallet.availableBalance),
    };
  }

  async rejectWithdrawal(transactionIdRaw: string, reason: string) {
    const transactionId = this.toBigInt(transactionIdRaw, 'transactionId');

    const pendingTx = await this.txRepo.findOne({
      where: {
        id: transactionId,
        type: WalletTransactionType.WITHDRAWAL,
        status: WalletTransactionStatus.PENDING,
      },
    });

    if (!pendingTx) {
      throw new NotFoundException('Pending withdrawal request not found');
    }

    pendingTx.status = WalletTransactionStatus.REJECTED;
    pendingTx.rejectionReason = reason;
    await this.txRepo.save(pendingTx);

    this.logger.log(`Withdrawal rejected: transaction=${transactionId}, reason=${reason}`);

    return {
      transactionId: pendingTx.id,
      status: pendingTx.status,
      rejectionReason: pendingTx.rejectionReason,
    };
  }

  async cancelWithdrawal(officeAccountId: bigint, transactionIdRaw: string) {
    const transactionId = this.toBigInt(transactionIdRaw, 'transactionId');

    const pendingTx = await this.txRepo
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.wallet', 'wallet')
      .where('tx.id = :transactionId', { transactionId })
      .andWhere('tx.type = :type', { type: WalletTransactionType.WITHDRAWAL })
      .andWhere('tx.status = :status', { status: WalletTransactionStatus.PENDING })
      .andWhere('wallet.office_account_id = :officeAccountId', { officeAccountId })
      .getOne();

    if (!pendingTx) {
      throw new NotFoundException('Pending withdrawal request not found for this office');
    }

    pendingTx.status = WalletTransactionStatus.CANCELLED;
    await this.txRepo.save(pendingTx);

    this.logger.log(
      `Withdrawal cancelled by office: transaction=${transactionId}, office=${officeAccountId}`,
    );

    return {
      transactionId: pendingTx.id,
      status: pendingTx.status,
    };
  }

  async getWithdrawalRequestById(account: Account, transactionIdRaw: string) {
    const transactionId = this.toBigInt(transactionIdRaw, 'transactionId');
    const qb = this.txRepo
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.wallet', 'wallet')
      .where('tx.id = :transactionId', { transactionId })
      .andWhere('tx.type = :type', { type: WalletTransactionType.WITHDRAWAL });

    if (account.role === RolesEnum.OFFICE) {
      qb.andWhere('wallet.office_account_id = :officeAccountId', {
        officeAccountId: account.id,
      });
    }

    const transaction = await qb.getOne();
    if (!transaction) {
      throw new NotFoundException('Withdrawal request not found');
    }

    return transaction;
  }

  async listWithdrawalRequests(account: Account, query: WithdrawRequestsQueryDto) {
    if (query.dateFrom && query.dateTo) {
      const from = new Date(query.dateFrom);
      const to = new Date(query.dateTo);
      if (from > to) {
        throw new BadRequestException('dateFrom must be less than or equal to dateTo');
      }
    }

    const qb = this.txRepo
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.wallet', 'wallet')
      .leftJoin('office_profiles', 'officeProfile', 'officeProfile.account_id = wallet.office_account_id')
      .where('tx.type = :type', { type: WalletTransactionType.WITHDRAWAL })
      .orderBy('tx.created_at', 'DESC');

    if (account.role === RolesEnum.OFFICE) {
      qb.andWhere('wallet.office_account_id = :officeAccountId', {
        officeAccountId: account.id,
      });
    }

    if (query.search?.trim()) {
      qb.andWhere('officeProfile.office_name ILIKE :search', {
        search: `%${query.search.trim()}%`,
      });
    }

    if (query.status) {
      qb.andWhere('tx.status = :status', { status: query.status });
    }

    if (query.dateFrom) {
      qb.andWhere('tx.created_at >= :dateFrom', { dateFrom: new Date(query.dateFrom) });
    }

    if (query.dateTo) {
      const dateTo = new Date(query.dateTo);
      dateTo.setHours(23, 59, 59, 999);
      qb.andWhere('tx.created_at <= :dateTo', { dateTo });
    }

    const [data, total] = await qb
      .skip(query.skip)
      .take(query.limit)
      .getManyAndCount();

    return {
      data,
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  private toBigInt(value: string, fieldName: string): bigint {
    try {
      return BigInt(value);
    } catch {
      throw new BadRequestException(`${fieldName} must be a valid bigint`);
    }
  }
}
