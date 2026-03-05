# Auth Flow Documentation

> Base URL: `/v1/auth`
> All responses are wrapped in the success envelope:
> ```json
> { "success": true, "message": "...", "data": { ... } }
> ```
> All errors return `{ "success": false, "message": "...", "statusCode": N }`

---

## Table of Contents

1. [User Registration Flow](#1-user-registration-flow)
2. [Office Registration Flow](#2-office-registration-flow)
3. [Login Flow](#3-login-flow)
4. [Token Management](#4-token-management)
5. [Forgot Password Flow](#5-forgot-password-flow)
6. [Authenticated Actions](#6-authenticated-actions)
7. [Account Stages Reference](#7-account-stages-reference)
8. [HTTP Status Codes Reference](#8-http-status-codes-reference)

---

## 1. User Registration Flow

```
POST /register/user  →  POST /verify-otp  →  Logged In
```

### Step 1 — Register

**`POST /v1/auth/register/user`**

Request:
```json
{
  "name": "Ahmed Mohamed",
  "email": "ahmed@example.com",
  "phone": "01012345678",
  "password": "Secret123!"
}
```

Response `200`:
```json
{
  "data": {
    "accountId": 1,
    "name": "Ahmed Mohamed",
    "email": "ahmed@example.com",
    "phone": "01012345678"
  }
}
```

> An OTP is sent to the phone number automatically.
> Save `accountId` — it is required in the next step.

---

### Step 2 — Verify Phone OTP

**`POST /v1/auth/verify-otp`**

Request:
```json
{
  "accountId": 1,
  "otp": "123456"
}
```

Response `200` — returns full login tokens:
```json
{
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "sessionId": 42,
    "account": {
      "accountId": 1,
      "email": "ahmed@example.com",
      "phone": "01012345678",
      "role": "USER",
      "accountStage": "ACTIVE"
    }
  }
}
```

> After successful OTP verification the user is fully logged in. Store `accessToken`, `refreshToken`, and `sessionId`.

---

### Resend OTP (if expired or not received)

**`POST /v1/auth/resend-otp/:accountId`**

```
POST /v1/auth/resend-otp/1
```

Response `200`: OTP resent message.

---

## 2. Office Registration Flow

Office registration has an **extended setup flow** before the account becomes `ACTIVE`. After login the `accountStage` field tells the frontend which step to complete next.

```
POST /register/office
  → POST /verify-otp          (phone verification)
  → [Add commerce number]     (accountStage: COMMERCE_NUMBER_MISSING)
  → [Add employees]           (accountStage: EMPLOYEES_PENDING)
  → [Upload logo]             (accountStage: LOGO_PENDING)
  → [Admin review]            (accountStage: REVIEW_PENDING → ACTIVE)
```

### Step 1 — Register Office

**`POST /v1/auth/register/office`**

Request:
```json
{
  "officeName": "Sky Travel Agency",
  "email": "sky@travel.com",
  "phone": "01098765432",
  "password": "Secret123!"
}
```

Response `200`:
```json
{
  "data": {
    "accountId": 2,
    "officeName": "Sky Travel Agency",
    "email": "sky@travel.com",
    "phone": "01098765432"
  }
}
```

### Step 2 — Verify Phone OTP

Same as user flow (`POST /v1/auth/verify-otp`).

Returns `accountStage: "COMMERCE_NUMBER_MISSING"` — redirect office to commerce number setup.

### Step 3 → onward — Complete Office Profile

After each login, check `accountStage` in the login response and redirect accordingly:

| `accountStage` | Action Required |
|---|---|
| `COMMERCE_NUMBER_MISSING` | Office must submit commerce number |
| `EMPLOYEES_PENDING` | Office must add at least one employee |
| `LOGO_PENDING` | Office must upload a logo |
| `REVIEW_PENDING` | Waiting for admin approval — show waiting screen |
| `REVIEW_REJECTED` | Application rejected — show rejection message |
| `ACTIVE` | Fully onboarded — allow access |

---

## 3. Login Flow

**`POST /v1/auth/login`**

Request:
```json
{
  "emailOrPhone": "ahmed@example.com",
  "password": "Secret123!"
}
```

### Scenario A — Successful Login

Response `200`:
```json
{
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "sessionId": 42,
    "account": {
      "accountId": 1,
      "email": "ahmed@example.com",
      "phone": "01012345678",
      "role": "USER",
      "accountStage": "ACTIVE"
    }
  }
}
```

### Scenario B — Phone Not Verified

Response `410` (custom code):
```json
{
  "success": false,
  "message": "Phone number not verified. OTP has been resent to your phone."
}
```

> Frontend must redirect to the OTP verification screen with the user's `accountId`.

### Scenario C — Wrong Credentials

Response `401`:
```json
{
  "success": false,
  "message": "Invalid credentials",
  "statusCode": 401
}
```

---

## 4. Token Management

### Token Lifetimes

| Token | Lifetime |
|---|---|
| `accessToken` | 15 minutes |
| `refreshToken` | 7 days |

### Scenario — Access Token Expired

When any protected endpoint returns **`411`**:
```json
{
  "success": false,
  "message": "Access token expired, please refresh"
}
```

> Call `POST /v1/auth/refresh` immediately, then retry the original request with the new `accessToken`.

### Refresh Tokens

**`POST /v1/auth/refresh`**

> Requires `refreshToken` in the `Authorization: Bearer <refreshToken>` header.

Request body:
```json
{
  "sessionId": 42,
  "refreshToken": "<current_refresh_token>"
}
```

Response `200`:
```json
{
  "data": {
    "accessToken": "<new_jwt>",
    "refreshToken": "<new_jwt>",
    "sessionId": 42
  }
}
```

> The old `refreshToken` is invalidated immediately (token rotation). Always store the new one.

---

### Logout (Current Device)

**`POST /v1/auth/logout`**

> Requires `refreshToken` in the `Authorization: Bearer <refreshToken>` header.

Revokes only the current session. Response `200`.

---

## 5. Forgot Password Flow

```
POST /forgot-password  →  POST /verify-password-reset-otp  →  POST /reset-password
```

### Step 1 — Request OTP

**`POST /v1/auth/forgot-password`**

Request:
```json
{
  "emailOrPhone": "ahmed@example.com"
}
```

Response `200` — OTP is sent to the registered phone number.

---

### Step 2 — Verify OTP

**`POST /v1/auth/verify-password-reset-otp`**

Request:
```json
{
  "emailOrPhone": "ahmed@example.com",
  "otp": "654321"
}
```

Response `200`:
```json
{
  "data": {
    "resetToken": "<short_lived_jwt>"
  }
}
```

> `resetToken` expires in **5 minutes**. Use it immediately in the next step.

---

### Step 3 — Set New Password

**`POST /v1/auth/reset-password`**

Request:
```json
{
  "resetToken": "<token_from_previous_step>",
  "newPassword": "NewSecret456!"
}
```

Response `200` — password updated, user must login again.

---

## 6. Authenticated Actions

> All endpoints below require `Authorization: Bearer <accessToken>` header.

---

### Get Current User Profile

**`GET /v1/auth/me`**

Response `200` — returns account info + profile details (user or office depending on role).

---

### Update Password (While Logged In)

**`POST /v1/auth/update-password`**

Request:
```json
{
  "currentPassword": "Secret123!",
  "newPassword": "NewSecret456!"
}
```

Response `200`.

Errors:
- `400` — Current password is incorrect.

---

### Update Profile (Name & Email)

**`POST /v1/auth/update-user-profile`**

Request:
```json
{
  "name": "Ahmed Ali",
  "email": "newemail@example.com"
}
```

Response `200` — updated account info.

---

### Change Phone Number

**`POST /v1/auth/change-phone`**

Request:
```json
{
  "newPhone": "01099998888",
  "password": "Secret123!"
}
```

Response `200`.

> After this call the account status resets to `PENDING_OTP`. The user **must** re-verify their new phone number via `POST /verify-otp` before making further authenticated requests. Until then all protected endpoints will return:
> ```json
> { "statusCode": 401, "message": "Account is pending OTP verification" }
> ```

---

## 7. Account Stages Reference

| Stage | Who | Meaning |
|---|---|---|
| `ACTIVE` | User & Office | Fully onboarded, all features available |
| `COMMERCE_NUMBER_MISSING` | Office only | Must submit commerce registration number |
| `EMPLOYEES_PENDING` | Office only | Must add at least one employee |
| `LOGO_PENDING` | Office only | Must upload office logo |
| `REVIEW_PENDING` | Office only | Submitted for admin review, access restricted |
| `REVIEW_REJECTED` | Office only | Admin rejected the application |

---

## 8. HTTP Status Codes Reference

| Code | Meaning |
|---|---|
| `200` | Success |
| `400` | Bad request / validation error |
| `401` | Unauthorized — invalid or missing token |
| `415` | Access token expired — call `/refresh` |
| `452` | Phone not verified — redirect to OTP screen |

---

## Full Flow Diagrams

### User Registration & Login

```
Register ──────────────────► verify-otp ──► Logged In (ACTIVE)
                                  │
                              OTP wrong ──► 400 error, retry
                              OTP expired ──► resend-otp → retry
```

### Office Registration

```
Register ──► verify-otp ──► Login (accountStage check)
                                │
                 ┌──────────────┼──────────────────────────┐
                 ▼             ▼                           ▼
      COMMERCE_NUMBER  EMPLOYEES_PENDING            LOGO_PENDING
         (add it)          (add staff)              (upload logo)
                 └──────────────┴──────────────────────────┘
                                │   all complete
                                ▼
                         REVIEW_PENDING  ──► Admin approves ──► ACTIVE
                                         ──► Admin rejects ──► REVIEW_REJECTED
```

### Token Refresh

```
API call ──► 415 (expired) ──► POST /refresh ──► new tokens ──► retry call
                                    │
                               400/401 ──► force logout → login screen
```

### Forgot Password

```
forgot-password ──► (OTP on phone) ──► verify-password-reset-otp
                                              │
                                       resetToken (5 min)
                                              │
                                       reset-password ──► success ──► login
```
