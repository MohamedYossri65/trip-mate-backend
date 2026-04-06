# 💳 Saved Cards Feature - Tap Payments Integration

## Overview

This feature allows users to save their payment cards securely using Tap Payments and use them for future transactions without re-entering card details.

---

## 🔹 Features

- ✅ **Card Verification & Save**: Verify and save cards with a minimal charge (0.01 SAR)
- ✅ **List Saved Cards**: Get all saved cards for a user
- ✅ **Update Card**: Set default card or activate/deactivate
- ✅ **Delete Card**: Remove saved cards
- ✅ **Pay with Saved Card**: Use saved cards for bookings and subscriptions

---

## 📋 API Endpoints

### 1. Verify and Save Card

**POST** `/api/v1/payments/cards/verify`

Initiates a card verification process with Tap. The user will be redirected to Tap's payment page to enter card details.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "setAsDefault": true
}
```

**Response:**
```json
{
  "redirectUrl": "https://tap.company/redirect/...",
  "chargeId": "chg_xxxxx"
}
```

**Flow:**
1. Call this endpoint
2. Redirect user to `redirectUrl`
3. User enters card details on Tap's secure page
4. Tap sends webhook to backend
5. Card is automatically saved in database

---

### 2. Get All Saved Cards

**GET** `/api/v1/payments/cards`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "cardBrand": "VISA",
    "lastFour": "1234",
    "firstSix": "450875",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "cardholderName": "Mohamed",
    "isDefault": true,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

### 3. Get Single Saved Card

**GET** `/api/v1/payments/cards/:cardId`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "cardBrand": "VISA",
  "lastFour": "1234",
  "isDefault": true,
  "isActive": true
}
```

---

### 4. Update Saved Card

**PATCH** `/api/v1/payments/cards/:cardId`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "isDefault": true,
  "isActive": true
}
```

**Response:**
```json
{
  "id": 1,
  "cardBrand": "VISA",
  "lastFour": "1234",
  "isDefault": true,
  "isActive": true
}
```

---

### 5. Delete Saved Card

**DELETE** `/api/v1/payments/cards/:cardId`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Card deleted successfully"
}
```

---

### 6. Pay Booking with Saved Card

**POST** `/api/v1/payments/booking/saved-card`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "cardId": 1,
  "bookingId": 123,
  "paymentType": "PARTIAL",
  "couponCode": "SUMMER2024"
}
```

**Payment Types:**
- `PARTIAL`: 25% of booking amount
- `FULL`: Remaining 75% of booking amount

**Response:**
```json
{
  "transactionId": 456,
  "chargeId": "chg_xxxxx"
}
```

**Note:** Payment is processed immediately without redirect. Check transaction status via webhook or verify endpoint.

---

### 7. Pay Subscription with Saved Card

**POST** `/api/v1/payments/subscription/saved-card`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "cardId": 1,
  "planId": 2
}
```

**Response:**
```json
{
  "transactionId": 789,
  "chargeId": "chg_xxxxx"
}
```

---

## 🔄 Webhook Flow

When a card verification or payment is completed:

1. Tap sends webhook to: `POST /api/v1/payments/webhook`
2. Backend retrieves charge details from Tap
3. If successful and `save_card` was true:
   - Card details are extracted from response
   - New `SavedCard` record is created
   - Card is linked to user account
4. Payment status is updated

**Webhook Payload Structure:**
```json
{
  "id": "chg_xxxxx",
  "status": "CAPTURED",
  "save_card": true,
  "card": {
    "id": "card_xxxxx",
    "brand": "VISA",
    "first_six": "450875",
    "last_four": "1234",
    "exp_month": 12,
    "exp_year": 2025,
    "name": "MOHAMED"
  },
  "customer": {
    "id": "cus_xxxxx"
  }
}
```

---

## 🔐 Security Considerations

1. **No Sensitive Data Storage**: We never store full card numbers, only:
   - First 6 digits (BIN)
   - Last 4 digits
   - Expiry date
   - Card brand

2. **Tap Card ID**: The actual card token (`card_xxxxx`) is stored and used for charges

3. **User Ownership**: All endpoints validate that the card belongs to the authenticated user

4. **Card Status**: Cards can be deactivated without deletion for audit purposes

---

## 💡 Best Practices

### 1. Default Card Logic
- Only one card can be default per user
- Setting a card as default automatically unsets other cards
- Use default card for one-click payments

### 2. Card Verification
- Use **0.01 SAR** charge for verification
- This amount is captured but can be refunded
- Ensures card is valid and has funds

### 3. Error Handling
- Check webhook status before processing
- Handle expired cards gracefully
- Provide clear error messages to users

### 4. Testing
```bash
# Test card verification
curl -X POST http://localhost:3000/api/v1/payments/cards/verify \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"setAsDefault": true}'

# Test payment with saved card
curl -X POST http://localhost:3000/api/v1/payments/booking/saved-card \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "cardId": 1,
    "bookingId": 123,
    "paymentType": "PARTIAL"
  }'
```

---

## 📊 Database Schema

**Table: `saved_cards`**

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| account_id | bigint | Foreign key to accounts |
| tap_card_id | varchar | Tap's card token (unique) |
| tap_customer_id | varchar | Tap's customer ID |
| card_brand | varchar | VISA, MASTERCARD, etc. |
| last_four | varchar | Last 4 digits |
| first_six | varchar | First 6 digits (BIN) |
| expiry_month | varchar | MM |
| expiry_year | varchar | YYYY |
| cardholder_name | varchar | Name on card |
| is_default | boolean | Default payment method |
| is_active | boolean | Active/inactive |
| created_at | timestamp | Creation date |
| updated_at | timestamp | Last update |

---

## 🚀 Implementation Checklist

- [x] Create `SavedCard` entity
- [x] Create DTOs for card operations
- [x] Implement `verifyAndSaveCard` service method
- [x] Implement card CRUD operations
- [x] Add webhook handler for card save
- [x] Implement payment with saved card
- [x] Add controller endpoints
- [x] Update payment module
- [ ] Add migration for `saved_cards` table
- [ ] Test with Tap sandbox environment
- [ ] Add frontend integration
- [ ] Setup webhook URL in Tap dashboard

---

## ⚠️ Important Notes

1. **Tap Feature Activation**: Ensure "Save Card" feature is enabled in your Tap account
2. **3D Secure**: Must be enabled (`threeDSecure: true`) for card verification
3. **Webhook URL**: Configure in Tap dashboard: `https://yourdomain.com/api/v1/payments/webhook`
4. **Currency**: Currently set to SAR (change in environment variables)
5. **Minimum Amount**: Verification uses 0.01 SAR (Tap's minimum)

---

## 🔧 Environment Variables

```env
TAP_SECRET_KEY=sk_test_xxxxx
TAP_CURRENCY=SAR
TAP_WEBHOOK_URL=https://yourdomain.com/api/v1/payments/webhook
TAP_REDIRECT_URL=https://yourdomain.com/payment/callback
```

---

## 📞 Support

For issues with Tap integration:
- Tap Support: https://www.tap.company/support
- Tap Docs: https://developers.tap.company/reference

For backend issues:
- Check application logs
- Verify webhook payloads
- Test with Tap sandbox first
