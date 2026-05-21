# Taqnyat SMS API Documentation

## Overview

The `TaqnyatSmsService` provides a complete integration with Taqnyat SMS API for sending SMS messages, managing scheduled messages, and monitoring account status.

## Service Location

```
src/common/services/taqnyat-sms.service.ts
```

## Configuration

Add these environment variables to your `.env` file:

```env
TAQNYAT_BEARER_TOKEN=your_bearer_token_here
TAQNYAT_SENDER=Your Sender Name
```

### Getting Your Bearer Token

1. Login to [Taqnyat Portal](https://portal.taqnyat.sa)
2. Navigate to **Developer** → **Application**
3. Click **Add** button
4. Name your application and select **SMS** service
5. Copy the generated **Bearer Token**

## Usage

### Import and Inject

```typescript
import { TaqnyatSmsService } from 'src/common/services/taqnyat-sms.service';

@Injectable()
export class YourService {
  constructor(
    private readonly taqnyatSmsService: TaqnyatSmsService,
  ) {}
}
```

### Send SMS

```typescript
const success = await this.taqnyatSmsService.sendSms({
  numbers: ['966500000000', '966511111111'],
  msg: 'Your verification code is 123456',
  sender: 'Trip Mates', // Optional, uses default from env
});

if (success) {
  console.log('SMS sent successfully');
}
```

### Send Scheduled SMS

```typescript
const success = await this.taqnyatSmsService.sendSms({
  numbers: ['966500000000'],
  msg: 'Reminder: Your appointment is tomorrow',
  scheduledDatetime: '2026-05-30T14:26', // Format: YYYY-MM-DDTHH:mm
  deleteId: 'appointment-reminder-123', // Unique ID for deletion
});
```

### Delete Scheduled Message

```typescript
const deleted = await this.taqnyatSmsService.deleteScheduledMessage(
  'appointment-reminder-123'
);

if (deleted) {
  console.log('Scheduled message deleted successfully');
}
```

### Check Account Balance

```typescript
const balance = await this.taqnyatSmsService.getAccountBalance();

if (balance) {
  console.log(`Balance: ${balance.balance} ${balance.currency}`);
  console.log(`Status: ${balance.accountStatus}`);
  console.log(`Expiry: ${balance.accountExpiryDate}`);
}
```

### Get Sender Names

```typescript
const senders = await this.taqnyatSmsService.getSenderNames();

if (senders) {
  senders.forEach(sender => {
    console.log(`${sender.senderName} - ${sender.status} (${sender.destination})`);
  });
}
```

### Check System Status

```typescript
const isOperational = await this.taqnyatSmsService.checkSystemStatus();

if (isOperational) {
  console.log('Taqnyat system is operational');
}
```

## Phone Number Format

Phone numbers must be in international format **without** `00` or `+` prefix:

✅ **Correct**: `966500000000`  
❌ **Wrong**: `+966500000000`  
❌ **Wrong**: `00966500000000`

The service automatically normalizes phone numbers, so you can pass them in any format.

## Response Types

### SendSmsParams

```typescript
type SendSmsParams = {
  numbers: string[];           // Array of phone numbers
  msg: string;                 // Message content
  sender?: string;             // Optional sender name
  scheduledDatetime?: string;  // Optional: YYYY-MM-DDTHH:mm
  deleteId?: string;           // Optional: Unique ID for scheduled messages
};
```

### TaqnyatBalanceResponse

```typescript
type TaqnyatBalanceResponse = {
  statusCode: number;
  accountStatus?: string;      // e.g., "active"
  accountExpiryDate?: string;  // e.g., "23-08-2027"
  balance?: string;            // e.g., "2044.000"
  currency?: string;           // e.g., "SAR"
  message?: string;            // Error message if failed
};
```

### TaqnyatSender

```typescript
type TaqnyatSender = {
  senderName: string;          // e.g., "Trip Mates"
  status: string;              // e.g., "active"
  destination: string;         // e.g., "KSA" or "international"
};
```

## Error Handling

The service returns `false` or `null` on errors and logs detailed error messages:

```typescript
const success = await this.taqnyatSmsService.sendSms({
  numbers: ['966500000000'],
  msg: 'Test message',
});

if (!success) {
  // Check logs for detailed error information
  // Possible errors:
  // - Invalid bearer token (401)
  // - Bad request (400)
  // - Method not allowed (405)
  // - Service not configured
  // - No valid phone numbers
  // - Too many recipients (>1000)
}
```

## Limitations

- **Maximum 1000 recipients** per request
- Sender name must be **pre-approved** by Taqnyat
- Phone numbers must be in **international format**
- Scheduled datetime format: **YYYY-MM-DDTHH:mm**

## Common Error Codes

| Code | Description |
|------|-------------|
| 401  | Invalid bearer token |
| 400  | Bad request (check message for details) |
| 405  | Method not allowed |
| 422  | Invalid deleteId (for scheduled messages) |

## Testing Best Practices

To avoid SMS costs during testing:

1. **Use scheduled SMS** with a future date
2. **Verify** the message appears in Taqnyat portal under "Scheduled SMS Archive"
3. **Delete** the scheduled message to get your balance back

```typescript
// 1. Schedule
await this.taqnyatSmsService.sendSms({
  numbers: ['966500000000'],
  msg: 'Test message',
  scheduledDatetime: '2026-12-31T23:59',
  deleteId: 'test-1',
});

// 2. Verify in portal

// 3. Delete
await this.taqnyatSmsService.deleteScheduledMessage('test-1');
```

## Security Settings

Configure in Taqnyat portal (**Developers** → **Security Settings**):

- Enable/disable API sending
- Whitelist IP addresses
- Whitelist countries

## Webhook Configuration

To receive SMS delivery status updates:

1. Go to **Developer tools** → **Developer** section
2. Enter your **Webhook URL**
3. Set a **pass phrase** for confirmation
4. Save settings

**Important**: Your webhook must return the pass phrase to confirm receipt.

## Support

- **Taqnyat Support**: support@taqnyat.sa
- **API Base URL**: https://api.taqnyat.sa
- **Portal**: https://portal.taqnyat.sa

## Example: OTP Verification

```typescript
async sendOtpSms(phoneNumber: string, code: string): Promise<boolean> {
  return await this.taqnyatSmsService.sendSms({
    numbers: [phoneNumber],
    msg: `Your verification code is: ${code}. Valid for 5 minutes.`,
  });
}
```

## Example: Booking Reminder

```typescript
async sendBookingReminder(
  phoneNumber: string,
  bookingDate: Date,
  bookingId: string,
): Promise<boolean> {
  const reminderTime = new Date(bookingDate);
  reminderTime.setHours(reminderTime.getHours() - 24); // 24 hours before

  const scheduledDatetime = reminderTime
    .toISOString()
    .slice(0, 16)
    .replace('T', 'T'); // Format: YYYY-MM-DDTHH:mm

  return await this.taqnyatSmsService.sendSms({
    numbers: [phoneNumber],
    msg: `Reminder: You have a booking tomorrow. Booking ID: ${bookingId}`,
    scheduledDatetime,
    deleteId: `booking-reminder-${bookingId}`,
  });
}
```

## Example: Bulk Notification

```typescript
async sendBulkNotification(
  phoneNumbers: string[],
  message: string,
): Promise<boolean> {
  // Taqnyat allows max 1000 recipients per request
  const chunks = this.chunkArray(phoneNumbers, 1000);
  
  for (const chunk of chunks) {
    const success = await this.taqnyatSmsService.sendSms({
      numbers: chunk,
      msg: message,
    });
    
    if (!success) {
      this.logger.error(`Failed to send SMS to chunk of ${chunk.length} recipients`);
      return false;
    }
  }
  
  return true;
}

private chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
```
