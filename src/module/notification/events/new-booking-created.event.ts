export class NewBookingCreatedEvent {
  constructor(
    public readonly bookingId: number,
    public readonly bookingType: string,
  ) {}
}
