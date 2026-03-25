export class TripBookedEvent {
  constructor(
    public readonly accountId: bigint,
    public readonly country: string,
    public readonly tripId?: number,
  ) {}
}
