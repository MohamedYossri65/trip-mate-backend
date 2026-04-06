# Trip Mate Chat API (Direct Booking Chat)

This chat implementation is strict and booking-based.

- Chat type: direct only (no groups)
- Conversation is tied to one booking + one office
- Chat is allowed only when there is an active offer between booking and office
- Office owner and office employees share the same conversation with the user

## Base Setup

- REST base: /conversations
- WebSocket namespace: /chat
- REST auth: Authorization: Bearer <access_token>
- WebSocket auth:
  - handshake.auth.token = <access_token>
  - or Authorization: Bearer <access_token> in handshake headers

## Core Business Rules

1. No group conversations are supported.
2. Conversation can be created only if:
- booking belongs to the user side of the conversation
- office has an offer on that booking
- offer is active (not rejected/replaced and not expired)
- booking is not completed/cancelled
3. Chat access is allowed only to:
- booking user account
- office owner account
- active office employees of that office
4. If offer expires or booking becomes completed/cancelled, chat access is blocked.

## Data Model Notes

chat_conversations:
- id
- type = DIRECT
- bookingId
- booking: object with `bookingId`, `bookingType`, and `activeOfferId`
- userAccountId
- officeAccountId
- createdByAccountId
- createdAt
- participants: array with each item including:
  - accountId
  - lastReadMessageId (nullable)
  - lastReadAt (nullable)
  - **isActive**: boolean - true if participant is currently connected to the chat

chat_participants:
- per-account read tracking
- office employees are synced into participants for the same office chat

## REST Endpoints

All endpoints are JWT protected.

### GET /conversations?page=1&limit=10
Returns accessible active conversations for current account:
- user sees their booking conversations
- office owner/employee sees office conversations
- each conversation includes a nested `booking` object with `bookingId`, `bookingType`, and `activeOfferId`
- Each participant includes `isActive` flag indicating if they're currently connected
- Response is paginated: `data`, `total`, `page`, `limit`

### GET /conversations/:id
Returns one conversation details if account is allowed.
- response includes a nested `booking` object with `bookingId`, `bookingType`, and `activeOfferId`
- Each participant includes `isActive` flag indicating if they're currently connected
- `latestMessage` shows the most recent message
- `myLastReadMessageId` and `myLastReadAt` show your read position

### POST /conversations
Create or return existing direct conversation for booking-office pair.

Request body:

```json
{
  "bookingId": "1001",
  "officeAccountId": "55"
}
```

Behavior:
- validates active offer for booking + office
- validates requester belongs to booking user side or office side
- reuses existing conversation for same booking/user/office

### GET /conversations/:id/messages?page=1&limit=10
Returns paginated messages ordered by createdAt DESC.

## WebSocket Events

Namespace: /chat

On connection:
- JWT validated
- server joins socket to allowed active conversation rooms

### Client -> Server

send_message

```json
{
  "conversationId": "9001",
  "content": "Hello",
  "attachmentUrl": "https://cdn.example.com/file.pdf",
  "type": "TEXT",
  "audioDurationSec": 12,
  "offerDetails": {
    "bookingType": "ON_SITE",
    "createdAt": "2026-04-03T10:30:00.000Z",
    "offerPrice": 250.5
  }
}
```

Rules:
- account must be allowed in conversation
- conversation must still have active offer conditions
- for non-`OFFER` messages, at least one of content/attachmentUrl is required
- if `type` is `AUDIO`, `audioDurationSec` is required (seconds)
- if `type` is `OFFER`, `offerDetails` is required
- `offerDetails` is only allowed when `type` is `OFFER`

OFFER message example:

```json
{
  "conversationId": "9001",
  "type": "OFFER",
  "offerDetails": {
    "bookingType": "ON_SITE",
    "createdAt": "2026-04-03T10:30:00.000Z",
    "offerPrice": 250.5
  }
}
```

`offerDetails` schema:
- `bookingType`: string
- `createdAt`: ISO date-time string
- `offerPrice`: number (minimum `0`)

typing

```json
{
  "conversationId": "9001",
  "isTyping": true
}
```

mark_as_read

```json
{
  "conversationId": "9001"
}
```

is_user_online

```json
{
  "userId": "22",
  "conversationId": "9001"
}
```

Behavior:
- if user is online, server emits `user_online` to conversation room
- if user is offline, server emits `user_offline` to conversation room

### Server -> Client

#### new_message
```json
{
  "event": "new_message",
  "data": {
    "message": {
      "id": "5001",
      "conversationId": "9001",
      "senderAccountId": "22",
      "content": "Hello there",
      "type": "TEXT",
      "audioDurationSec": null,
      "offerDetails": null,
      "createdAt": "2026-03-25T12:00:00Z"
    }
  }
}
```

`new_message` for `OFFER` type will include:

```json
{
  "event": "new_message",
  "data": {
    "message": {
      "id": "5002",
      "conversationId": "9001",
      "senderAccountId": "55",
      "type": "OFFER",
      "offerDetails": {
        "offerId" : 10,
        "bookingType": "ON_SITE",
        "createdAt": "2026-04-03T10:30:00.000Z",
        "offerPrice": 250.5
      },
      "createdAt": "2026-04-03T10:31:00.000Z"
    }
  }
}
```

#### message_delivered
```json
{
  "event": "message_delivered",
  "data": {
    "conversationId": "9001",
    "messageId": "5001",
    "deliveredTo": ["22", "23"]
  }
}
```

#### user_typing
```json
{
  "event": "user_typing",
  "data": {
    "conversationId": "9001",
    "userId": "22",
    "isTyping": true
  }
}
```

#### message_read
```json
{
  "event": "message_read",
  "data": {
    "conversationId": "9001",
    "userId": "22",
    "lastReadMessageId": "5001",
    "lastReadAt": "2026-03-25T12:05:00Z"
  }
}
```

#### user_online
```json
{
  "event": "user_online",
  "data": {
    "userId": "22",
    "conversationId": "9001",
    "timestamp": "2026-03-25T12:00:00Z"
  }
}
```

#### user_offline
```json
{
  "event": "user_offline",
  "data": {
    "userId": "22",
    "conversationId": "9001",
    "timestamp": "2026-03-25T12:05:00Z"
  }
}
```

## Error Behavior

- 403 Forbidden:
  - no active offer for booking+office
  - offer expired / booking closed
  - requester not part of allowed user-office scope
- 404 Not Found:
  - conversation not found
- 400 Bad Request:
  - invalid IDs
  - invalid message payload

## Client Flow Recommendation

1. Create/open conversation using POST /conversations with bookingId + officeAccountId.
2. Connect websocket to /chat with JWT.
3. Load messages via GET /conversations/:id/messages.
4. Send realtime events: send_message, typing, mark_as_read, is_user_online.
5. Handle server events: new_message, message_delivered, user_typing, message_read, user_online, user_offline.
