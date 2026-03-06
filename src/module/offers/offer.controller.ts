import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { OffersService } from "./offers.service";
import { Account } from "../account/entity/account.entity";
import { CurrentUser } from "src/common/guards/user.decorator";
import { SuccessResponse } from "src/common/interceptors/success-response.interceptor";
import { Auth } from "src/common/guards/auth.decorator";
import { CreateCarOfferDto } from "./dto/create-car-offer.dto";
import { CreateVisaOfferDto } from "./dto/create-visa-offer.dto";
import { CreateFlightOfferDto } from "./dto/create-flight-offer.dto";
import { CreateHotelOfferDto } from "./dto/create-hotel-offer.dto";
import { UpdateCarOfferDto } from "./dto/update-car-offer.dto";
import { UpdateVisaOfferDto } from "./dto/update-visa-offer.dto";
import { UpdateFlightOfferDto } from "./dto/update-flight-offer.dto";
import { UpdateHotelOfferDto } from "./dto/update-hotel-offer.dto";
import { OfferFilterDto } from "./dto/offer-filter.dto";

@ApiTags('offers')
@Controller({ path: 'offers', version: '1' })
export class OffersController {
    constructor(private readonly offersService: OffersService) { }
  // ─── Car ─────────────────────────────────────────────────────────
    @Post('car')
    @Auth()
    @ApiOperation({ summary: 'Create a car offer' })
    @SuccessResponse('Car offer created successfully')
    async createCarOffer(
        @Body() dto: CreateCarOfferDto,
        @CurrentUser() account: Account,
    ) {
        return await this.offersService.createCarRentalOffer(
            dto,
            account.id
        );
    }

    @Get('car/booking/:bookingId')
    @Auth()
    @ApiOperation({ summary: 'Get offers for a booking' })
    @SuccessResponse('Offers retrieved successfully')
    async findCarOffersByBookingId(
        @Param('bookingId') bookingId: string,
    ) {
        return await this.offersService.findCarOffersByBookingId(BigInt(bookingId));
    }

    @Get('car/:offerId')
    @Auth()
    @ApiOperation({ summary: 'Get a car offer' })
    @SuccessResponse('Car offer retrieved successfully')
    async findOneCarOffer(
        @Param('offerId') offerId: string,
    ) {
        return await this.offersService.findOneCarOffer(BigInt(offerId));
    }

    @Patch('car/:offerId')
    @Auth()
    @ApiOperation({ summary: 'Update a car offer' })
    @SuccessResponse('Car offer updated successfully')
    async updateCarOffer(
        @Param('offerId') offerId: string,
        @Body() dto: UpdateCarOfferDto,
        @CurrentUser() account: Account,
    ) {
        return await this.offersService.updateCarOffer(
            BigInt(offerId),
            dto,
            account.id,
        );
    }
  // ─── Visa ─────────────────────────────────────────────────────────

    @Post('visa')
    @Auth()
    @ApiOperation({ summary: 'Create a visa offer' })
    @SuccessResponse('Visa offer created successfully')
    async createVisaOffer(
        @Body() dto: CreateVisaOfferDto,
        @CurrentUser() account: Account,
    ) {
        return await this.offersService.createVisaOffer(
            dto,
            account.id,
        );
    }

    @Get('visa/booking/:bookingId')
    @Auth()
    @ApiOperation({ summary: 'Get offers for a booking' })
    @SuccessResponse('Offers retrieved successfully')
    async findVisaOffersByBookingId(
        @Param('bookingId') bookingId: string,
    ) {
        return await this.offersService.findVisaOffersByBookingId(BigInt(bookingId));
    }

    @Get('visa/:offerId')
    @Auth()
    @ApiOperation({ summary: 'Get a visa offer' })
    @SuccessResponse('Visa offer retrieved successfully')
    async findOneVisaOffer(
        @Param('offerId') offerId: string,
    ) {
        return await this.offersService.findOneVisaOffer(BigInt(offerId));
    }

    @Patch('visa/:offerId')
    @Auth()
    @ApiOperation({ summary: 'Update a visa offer' })
    @SuccessResponse('Visa offer updated successfully')
    async updateVisaOffer(
        @Param('offerId') offerId: string,
        @Body() dto: UpdateVisaOfferDto,
        @CurrentUser() account: Account,
    ) {
        return await this.offersService.updateVisaOffer(
            BigInt(offerId),
            dto,
            account.id,
        );
    }

    // ─── Flight ─────────────────────────────────────────────────────────

    @Post('flight')
    @Auth()
    @ApiOperation({ summary: 'Create a flight offer' })
    @SuccessResponse('Flight offer created successfully')
    async createFlightOffer(
        @Body() dto: CreateFlightOfferDto,
        @CurrentUser() account: Account,
    ) {
        return await this.offersService.createFlightOffer(
            dto,
            account.id,
        );
    }

    @Get('flight/booking/:bookingId')
    @Auth()
    @ApiOperation({ summary: 'Get offers for a booking' })
    @SuccessResponse('Offers retrieved successfully')
    async findFlightOffersByBookingId(
        @Param('bookingId') bookingId: string,
    ) {
        return await this.offersService.findFlightOffersByBookingId(BigInt(bookingId));
    }

    @Get('flight/:offerId')
    @Auth()
    @ApiOperation({ summary: 'Get a flight offer' })
    @SuccessResponse('Flight offer retrieved successfully')
    async findOneFlightOffer(
        @Param('offerId') offerId: string,
    ) {
        return await this.offersService.findOneFlightOffer(BigInt(offerId));
    }

    @Patch('flight/:offerId')
    @Auth()
    @ApiOperation({ summary: 'Update a flight offer' })
    @SuccessResponse('Flight offer updated successfully')
    async updateFlightOffer(
        @Param('offerId') offerId: string,
        @Body() dto: UpdateFlightOfferDto,
        @CurrentUser() account: Account,
    ) {
        return await this.offersService.updateFlightOffer(
            BigInt(offerId),
            dto,
            account.id,
        );
    }

    // ─── Hotel ─────────────────────────────────────────────────────────

    @Post('hotel')
    @Auth()
    @ApiOperation({ summary: 'Create a hotel offer' })
    @SuccessResponse('Hotel offer created successfully')
    async createHotelOffer(
        @Body() dto: CreateHotelOfferDto,
        @CurrentUser() account: Account,
    ) {
        return await this.offersService.createHotelOffer(
            dto,
            account.id,
        );
    }

    @Get('hotel/booking/:bookingId')
    @Auth()
    @ApiOperation({ summary: 'Get offers for a booking' })
    @SuccessResponse('Offers retrieved successfully')
    async findHotelOffersByBookingId(
        @Param('bookingId') bookingId: string,
    ) {
        return await this.offersService.findHotelOffersByBookingId(BigInt(bookingId));
    }

    @Get('hotel/:offerId')
    @Auth()
    @ApiOperation({ summary: 'Get a hotel offer' })
    @SuccessResponse('Hotel offer retrieved successfully')
    async findOneHotelOffer(
        @Param('offerId') offerId: string,
    ) {
        return await this.offersService.findOneHotelOffer(BigInt(offerId));
    }

    @Patch('hotel/:offerId')
    @Auth()
    @ApiOperation({ summary: 'Update a hotel offer' })
    @SuccessResponse('Hotel offer updated successfully')
    async updateHotelOffer(
        @Param('offerId') offerId: string,
        @Body() dto: UpdateHotelOfferDto,
        @CurrentUser() account: Account,
    ) {
        return await this.offersService.updateHotelOffer(
            BigInt(offerId),
            dto,
            account.id,
        );
    }

    // @Post('bundle')
    // @Auth()
    // @ApiOperation({ summary: 'Create a bundle offer' })
    // @SuccessResponse('Bundle offer created successfully')
    // async createBundleOffer(
    //     @Body() dto: CreateBundleOfferDto,
    //     @CurrentUser() account: Account,
    // ) {
    //     return await this.offersService.createBundleOffer(
    //         dto,
    //         account.id,
    //     );
    // }

    @Get('office')
    @Auth()
    @ApiOperation({ summary: 'Get offers for an office' })
    @SuccessResponse('Offers retrieved successfully')
    async findOfficeOffers(
        @CurrentUser() account: Account,
        @Query() dto: OfferFilterDto,
    ) {
        return await this.offersService.findOfficeOffers(account.id, dto);
    }
}