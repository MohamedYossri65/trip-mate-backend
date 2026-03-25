# Notification System Report

Date: 2026-03-17
Scope: How the notification system is built in this repository, and the role of Redis and Bull.

## 1) High-Level Architecture

The notification system is event-driven and queue-based:

1. Domain modules emit business events (for example booking state changes and new offers).
2. Notification listener subscribes to these events.
3. Notification service renders localized templates, stores notification rows in PostgreSQL, and enqueues jobs.
4. Bull worker (processor) consumes jobs asynchronously from a Redis-backed queue.
5. Push channel service sends notifications to OneSignal.
6. Delivery status is updated in database (SENT or FAILED).

This design separates request/transaction flow from slow I/O delivery work.

## 2) Main Components and Responsibilities

### App-level queue setup

- Global Bull setup is in src/app.module.ts.
- Bull is configured with Redis connection from environment:
  - REDIS_HOST (default localhost)
  - REDIS_PORT (default 6379)

### Notification module wiring

- src/module/notification/notification.module.ts registers:
  - TypeORM entities: NotificationTemplate, Notification, UserDevice, Account
  - Bull queue: notification-queue
  - Core providers: NotificationService, NotificationListener, NotificationProcessor, TemplateService, PushService

### Event listener

- src/module/notification/notification.listener.ts handles:
  - booking.status_changed
  - new.booking
  - new.offer
  - trip.booked
  - visa.approved

Behavior:

- For each event, it calls NotificationService.createAndQueue(...) with a template key and payload.
- For new.booking, it targets all OFFICE accounts by role.

### Notification service

- src/module/notification/notification.service.ts is the orchestration layer:
  - createAndQueue(...):
    - Resolves template + language
    - Persists notification with PENDING status
    - Adds Bull job send with retries/backoff
  - sendBulk(...):
    - Segment mode: one queued send-bulk-segment job
    - Account list mode: chunk to batches of 500, queue send-bulk-batch jobs
  - User APIs support:
    - list notifications (paginated)
    - unread count
    - mark read / mark all read
  - Device token lifecycle:
    - register device token
    - remove device token
    - fetch tokens for delivery

### Queue processor

- src/module/notification/notification.processor.ts consumes notification-queue jobs:

1. send job (single notification)
   - Loads notification row
   - Routes by channel:
     - PUSH: send via OneSignal using device tokens, fallback to external user IDs
     - IN_APP: no external send, mark as sent
     - EMAIL/SMS: placeholders (not implemented)
   - Updates status to SENT or FAILED
   - Throws on processing errors so Bull can retry

2. send-bulk-batch job
   - Iterates each account in the batch
   - Renders template per recipient
   - Persists notification row
   - Delivers by channel
   - Updates per-row status

3. send-bulk-segment job
   - Renders one template (default language)
   - Sends to OneSignal segment directly
   - No per-user notification rows created in this path

### Template rendering

- src/module/notification/services/template.service.ts:
  - Uses Handlebars templates stored in DB.
  - Language fallback chain:
    1) user language
    2) DEFAULT_LANGUAGE (default ar)
    3) en

### Push delivery

- src/module/notification/channels/push.service.ts:
  - Integrates with OneSignal REST API.
  - Supports:
    - include_player_ids
    - include_external_user_ids
    - included_segments
  - Returns boolean success/failure and logs provider errors.

## 3) Data Model Used by Notifications

- notifications table (entity: Notification):
  - account_id, template_key, title, body, channel, status, data, read_at, created_at

- user_devices table (entity: UserDevice):
  - account_id, device_token (unique), device_type, app_version, last_seen, created_at

- notification_templates table (entity: NotificationTemplate):
  - template_key + language + channel unique
  - title_template, body_template, direction

## 4) Where Events Are Produced

Confirmed producers found in this repository:

- src/module/bookings/bookings.service.ts emits:
  - booking.status_changed
  - new.booking

- src/module/offers/offers.service.ts emits:
  - new.offer

Notes:

- Listener handlers exist for trip.booked and visa.approved, but no producer was found in current source scan. They may be planned or emitted from code paths not currently present.

## 5) Role of Bull

Bull is the job orchestration layer.

What Bull provides here:

- Async processing: notification sending happens outside request path.
- Retry policy: attempts=3 with exponential backoff for transient failures.
- Workload smoothing: queue absorbs spikes (especially bulk jobs).
- Batch fan-out support: one API request can enqueue many controlled jobs.
- Worker isolation: send logic is centralized in processor handlers.

Without Bull, API handlers/services would block on push provider latency and have weaker retry/failure handling.

## 6) Role of Redis

Redis is the queue backend/state store used by Bull.

What Redis is doing in this system:

- Stores pending Bull jobs and their metadata/state.
- Coordinates producer-consumer flow between service and processor.
- Persists retry/backoff scheduling state.
- Enables reliable dequeue/processing semantics for worker execution.

Operational dependency:

- If Redis is unavailable, job enqueue and processing fail.
- Notification DB row creation can still happen before enqueue in some flows, resulting in PENDING rows that are never processed until queue health is restored and jobs are requeued.

Deployment reference:

- docker-compose.redis.yml defines Redis 7 with AOF persistence and port 6379.

## 7) Runtime Flow (Single Notification)

1. Domain service emits event.
2. NotificationListener handles event and calls createAndQueue.
3. NotificationService renders template and inserts notifications row (PENDING).
4. NotificationService enqueues Bull job send.
5. NotificationProcessor receives job.
6. PushService sends via OneSignal.
7. Notification status updated to SENT or FAILED.
8. User reads notification through notifications endpoints.

## 8) Runtime Flow (Bulk Notification)

1. Admin calls POST /notifications/bulk.
2. NotificationService resolves recipients:
   - segment path: enqueue send-bulk-segment
   - account path: split into batches of 500 and enqueue send-bulk-batch jobs
3. Processor handles each batch job and each account inside it.
4. For each recipient, notification is rendered, stored, delivered, and status-updated.

## 9) Current Strengths

- Clear separation of concerns (events, orchestration, queue worker, channel).
- Good resilience defaults (retry + exponential backoff).
- Multi-recipient scaling strategy (batching + segment shortcut).
- Localized template rendering with fallbacks.

## 10) Current Gaps / Risks

- EMAIL and SMS channels are declared but not implemented.
- No explicit dead-letter handling/dashboard in code for repeatedly failing jobs.
- Segment bulk path does not create per-user DB audit rows.
- createAndQueue saves DB row before queue add; enqueue failure can leave orphan PENDING notifications.
- trip.booked and visa.approved listeners currently have no confirmed emitters in scanned code.

## 11) Summary

The notification system is a classic NestJS event + Bull queue architecture.

- Bull handles asynchronous execution, retries, and throughput management.
- Redis is the required persistence/coordination layer underneath Bull.

Together, Redis + Bull are the reliability and scalability backbone of notification delivery in this codebase.
