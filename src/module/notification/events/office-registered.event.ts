export class OfficeRegisteredEvent {
  constructor(
    public readonly officeAccountId: bigint,
    public readonly officeName: string,
  ) {}
}
