import { Booking } from '../entity/booking.entity';

export class BookingMapper {
  id: bigint;
  type: string;
  status: string;
  user: {
    accountId: bigint;
    name: string;
    account: {
      email: string;
      phone: string;
      status: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;

  static fromEntities(booking: Booking): BookingMapper {
    return {
      id: booking.id,
      type: booking.type,
      status: booking.status,
      user: {
        accountId: booking.user.accountId,
        name: booking.user.name,
        account: {
          email: booking.user.account.email,
          phone: booking.user.account.phone,
          status: booking.user.account.status,
        },
      },
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }
}
