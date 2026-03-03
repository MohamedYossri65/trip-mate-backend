import { Injectable, UnauthorizedException, HttpException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AccountService } from '../account/account.service';
import { AccountStatus } from 'src/common/enums/account-status.enum';
import { ResponseCode } from 'src/common/constant/responses-code';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly accountService: AccountService) {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not defined in environment variables');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      ignoreExpiration: true,
    });
  }

  async validate(payload: {
    sub: bigint;
    role: string;
    iat: number;
    exp: number;
  }) {
    // payload = { sub, role, iat, exp }

    // Check expiration manually so we can return 415 instead of 401
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new HttpException('Access token expired, please refresh', ResponseCode.TOKEN_EXPIRED);
    }

    const account = await this.accountService.findById(payload.sub);

    if (!account) {
      throw new UnauthorizedException('Invalid access token');
    }
    if(account.status === AccountStatus.PENDING_OTP) {
      throw new UnauthorizedException('Account is pending OTP verification');
    }

    // attaches to req.user
    return account;
  }
}