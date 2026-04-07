export class NewOfferReceivedEvent {
  constructor(
    public readonly accountId: bigint,
    public readonly bookingId: number,
    public readonly offerId: number,
    public readonly bookingType: string,
    public readonly offerPrice: number,
  ) {}
}
