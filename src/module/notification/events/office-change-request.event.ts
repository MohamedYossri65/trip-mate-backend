export class OfficeChangeRequestEvent {
  constructor(
    public readonly officeAccountId: bigint,
    public readonly officeName: string,
  ) {}
}
