import { InjectRepository } from '@nestjs/typeorm';
import { Session } from './entity/session.entity';
import { Repository } from 'typeorm';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Account } from '../account/entity/account.entity';
import * as bcrypt from 'bcrypt';
import { addDays } from 'date-fns';
import { UAParser } from 'ua-parser-js';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
  ) {}

  async createSession({
    account,
    refreshToken,
    req,
  }: {
    account: Account;
    refreshToken: string;
    req: Request;
  }) {
    const hash = await bcrypt.hash(refreshToken, 10);

    const parser = new UAParser(req.headers['user-agent']);
    const deviceName = `${parser.getBrowser().name} on ${parser.getOS().name}`;
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) ||
      'unknown';

    const session = this.sessionRepo.create({
      account,
      refreshTokenHash: hash,
      deviceName,
      userAgent: req.headers['user-agent'],
      ipAddress,
      expiresAt: addDays(new Date(), 7),
    });

    return this.sessionRepo.save(session);
  }

  async validateSession(
    accountId: bigint,
    sessionId: bigint,
    incomingRefreshToken: string,
  ) {
    const session = await this.sessionRepo.findOne({
      where: {
        id: sessionId,
        account: { id: accountId },
        isRevoked: false,
      },
      relations: ['account'],
    });

    if (!session) throw new UnauthorizedException();

    const isMatch = await bcrypt.compare(
      incomingRefreshToken,
      session.refreshTokenHash,
    );

    if (!isMatch) {
      await this.revokeAllSessions(accountId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    return session;
  }

  async rotateRefreshToken(session: Session, newRefreshToken: string) {
    session.refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    return this.sessionRepo.save(session);
  }

  async revokeSession(sessionId: bigint) {
    return this.sessionRepo.update({ id: sessionId }, { isRevoked: true });
  }

  async revokeAllSessions(accountId: bigint) {
    return this.sessionRepo.update(
      { account: { id: accountId } },
      { isRevoked: true },
    );
  }
}
