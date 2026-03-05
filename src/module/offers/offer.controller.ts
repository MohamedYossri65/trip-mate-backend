import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { OffersService } from "./offers.service";
import { Account } from "../account/entity/account.entity";
import { CurrentUser } from "src/common/guards/user.decorator";
import { SuccessResponse } from "src/common/interceptors/success-response.interceptor";
import { Auth } from "src/common/guards/auth.decorator";
import { CreateCarOfferDto } from "./dto/create-car-offer.dto";

@ApiTags('offers')
@Controller({ path: 'offers', version: '1' })
export class OffersController {
    constructor(private readonly offersService: OffersService) { }

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

    @Get('/:bookingId')
    @Auth()
    @ApiOperation({ summary: 'Get offers for a booking' })
    @SuccessResponse('Offers retrieved successfully')
    async findOffersByBookingId(
        @Body('bookingId') bookingId: bigint,
    ) {
        return await this.offersService.findOffersByBookingId(bookingId);
    }
}