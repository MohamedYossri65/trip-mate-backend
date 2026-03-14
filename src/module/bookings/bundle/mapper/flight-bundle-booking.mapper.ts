import { CreateBundleFlightBookingDto } from "../dto/create-bundle-booking.dto";
import { FlightBundle } from "../entity/bundle-flight.entity";

export class FlightBundleBookingMapper {
    bundleBaseId: bigint;
    ticketGrade: string;

    static toEntity(bundleBaseId: bigint, dto: CreateBundleFlightBookingDto): FlightBundle {
        const entity = new FlightBundle();

        entity.bundleBaseId = bundleBaseId;
        entity.ticketGrade = dto.ticketGrade;

        return entity;
    }

    static toDto(entity: FlightBundle): FlightBundleBookingMapper {
        return {
            bundleBaseId: entity.bundleBaseId,
            ticketGrade: entity.ticketGrade
        };
    }

}