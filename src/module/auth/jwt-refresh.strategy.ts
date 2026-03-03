import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { SessionService } from './session.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {

  constructor(private readonly sessionService: SessionService) {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
    }
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const sessionId = req.body.sessionId;
    if (!sessionId) {
      throw new UnauthorizedException('Session ID missing');
    }

    const session = await this.sessionService.validateSession(
      payload.sub, // accountId
      BigInt(sessionId),
      refreshToken,
    );

    (req as any).refreshToken = refreshToken;
    (req as any).sessionId = session.id;

    return session.account;
  }
}