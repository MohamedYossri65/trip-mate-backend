import { TypeOrmModule } from "@nestjs/typeorm";
import { Offer } from "./entity/offer.entity";
import { OffersService } from "./offers.service";
import { Module } from "@nestjs/common";
import { OffersController } from "./offer.controller";
import { CarOfferDetails } from "./entity/car-offer-details";

@Module({
  imports: [TypeOrmModule.forFeature([Offer ,CarOfferDetails])],
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}