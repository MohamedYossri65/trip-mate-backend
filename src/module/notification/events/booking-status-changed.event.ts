export class BookingStatusChangedEvent {
  constructor(
    public readonly accountId: bigint,
    public readonly bookingId: number,
    public readonly newStatus: string,
    public readonly bookingType?: string,
  ) {}
}
