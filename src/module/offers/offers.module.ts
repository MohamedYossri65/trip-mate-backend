import { TypeOrmModule } from "@nestjs/typeorm";
import { Offer } from "./offer.entity";
import { OffersService } from "./offers.service";
import { Module } from "@nestjs/common";

@Module({
  imports: [TypeOrmModule.forFeature([Offer])],
  controllers: [],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}