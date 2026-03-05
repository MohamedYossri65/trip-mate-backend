import { TypeOrmModule } from "@nestjs/typeorm";
import { Offer } from "./entity/offer.entity";
import { OffersService } from "./offers.service";
import { Module } from "@nestjs/common";
import { OffersController } from "./offer.controller";
import { CarOfferDetails } from "./entity/car-offer-details";
import { OfferRepository } from "./repository/offer.repository";

@Module({
  imports: [TypeOrmModule.forFeature([Offer ,CarOfferDetails])],
  controllers: [OffersController],
  providers: [OffersService ,OfferRepository],
  exports: [OffersService],
})
export class OffersModule {}