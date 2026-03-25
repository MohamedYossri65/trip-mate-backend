export class VisaApprovedEvent {
  constructor(
    public readonly accountId: bigint,
    public readonly country: string,
    public readonly visaId?: number,
  ) {}
}
