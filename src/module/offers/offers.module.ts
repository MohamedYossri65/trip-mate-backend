import { TypeOrmModule } from "@nestjs/typeorm";
import { Offer } from "./entity/offer.entity";
import { OffersService } from "./offers.service";
import { Module } from "@nestjs/common";
import { OffersController } from "./offer.controller";
import { CarOfferDetails } from "./entity/car-offer-details";
import { VisaOfferDetails } from "./entity/visa-offer-details";
import { FlightOfferDetails } from "./entity/flight-offer-details";
import { HotelOfferDetails } from "./entity/hotel-offer-details";
import { BundleOfferDetails } from "./entity/bundle-offer-details";
import { OfferRepository } from "./repository/offer.repository";
import { OfficeModule } from "../office/office.module";

@Module({
  imports: [TypeOrmModule.forFeature([
    Offer,
    CarOfferDetails,
    VisaOfferDetails,
    FlightOfferDetails,
    HotelOfferDetails,
    BundleOfferDetails,
  ],),
    OfficeModule,
  ],
  controllers: [OffersController],
  providers: [OffersService, OfferRepository],
  exports: [OffersService],
})
export class OffersModule { }