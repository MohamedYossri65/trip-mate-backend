import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { BookingSettingsService } from '../booking-settings.service';
import { BookingType } from '../../domain/enum/booking-type.enum';

/**
 * Guard that checks whether a booking service type is enabled
 * before allowing a booking to be created.
 *
 * It derives the BookingType from the request route path:
 *   POST /bookings/hotel  → HOTEL
 *   POST /bookings/car    → CAR
 *   POST /bookings/flight → FLIGHT
 *   POST /bookings/visa   → VISA
 *   POST /bookings/bundle → BUNDLE
 */
@Injectable()
export class BookingServiceGuard implements CanActivate {
  private static readonly PATH_TO_TYPE: Record<string, BookingType> = {
    hotel: BookingType.HOTEL,
    car: BookingType.CAR,
    flight: BookingType.FLIGHT,
    visa: BookingType.VISA,
    bundle: BookingType.BUNDLE,
  };

  constructor(private readonly settingsService: BookingSettingsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const routePath: string = request.route?.path ?? request.url;

    // Extract the last segment of the path (e.g. "hotel" from "/v1/bookings/hotel")
    const segments = routePath.replace(/\/$/, '').split('/');
    const lastSegment = segments[segments.length - 1]?.toLowerCase();

    const bookingType = BookingServiceGuard.PATH_TO_TYPE[lastSegment];

    // If we can't determine the type, let the request through
    // (it's not a booking-creation route we care about)
    if (!bookingType) return true;

    const enabled = await this.settingsService.isServiceEnabled(bookingType);

    if (!enabled) {
      throw new BadRequestException(
        `The ${bookingType.toLowerCase()} booking service is currently disabled`,
      );
    }

    return true;
  }
}
