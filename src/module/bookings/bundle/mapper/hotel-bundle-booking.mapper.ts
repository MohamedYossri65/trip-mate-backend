import { RoomDetail } from '../../services/hotel/entity/hotel-booking.entity';
import { CreateBundleHotelBookingDto } from '../dto/create-bundle-booking.dto';
import { HotelBundle } from '../entity/bundle-hotel.entity';
export class HotelBundleBookingMapper {

    bundleBaseId: bigint;
    isTherePreferredHotel: boolean;
    hotelName: string;
    starRating: number;
    roomDetails: RoomDetail[];
    notes: string;

    static toEntity(dto: CreateBundleHotelBookingDto): HotelBundle {
        const entity = new HotelBundle();

        entity.isTherePreferredHotel = dto.isTherePreferredHotel;
        entity.hotelName = dto.preferredHotelName;
        entity.starRating = dto.hotelStarRating;
        entity.roomDetails = dto.roomDetails;
        entity.notes = dto.notes;

        return entity;
    }

    static toDto(entity: HotelBundle): HotelBundleBookingMapper {
        return {
            bundleBaseId: entity.bundleBaseId,
            isTherePreferredHotel: entity.isTherePreferredHotel,
            hotelName: entity.hotelName || '',
            starRating: entity.starRating,
            roomDetails: entity.roomDetails,
            notes: entity.notes || ''
        };
    }

}