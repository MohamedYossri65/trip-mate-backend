# 💳 Quick Start Guide - Saved Cards Feature

## 🚀 Getting Started

### Step 1: Run Database Migration
```bash
# Connect to your PostgreSQL database
psql -U your_username -d trip_mate_db -f create_saved_cards_table.sql

# Or use your preferred DB client to run the SQL file
```

### Step 2: Configure Tap Dashboard
1. Login to https://dashboard.tap.company
2. Go to **Settings** → **Checkout Settings**
3. Enable **"Save Card"** feature
4. Enable **"3D Secure Authentication"**
5. Go to **Webhooks**
6. Add webhook URL: `https://yourdomain.com/api/v1/payments/webhook`
7. Copy your **Secret Key** (starts with `sk_live_` or `sk_test_`)

### Step 3: Update Environment Variables
```env
TAP_SECRET_KEY=sk_live_xxxxxxxxxxxxx
TAP_CURRENCY=SAR
TAP_WEBHOOK_URL=https://yourdomain.com/api/v1/payments/webhook
TAP_REDIRECT_URL=https://yourdomain.com/payment/callback
```

### Step 4: Restart Your Application
```bash
npm run start:dev
```

---

## 📱 Basic Usage

### 1️⃣ Save a Card (First Time)

**Frontend Code:**
```javascript
// User clicks "Add Card" button
const response = await fetch('/api/v1/payments/cards/verify', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    setAsDefault: true
  })
});

const { redirectUrl } = await response.json();

// Redirect user to Tap's secure page
window.location.href = redirectUrl;

// User enters card details on Tap → Card is saved automatically
```

---

### 2️⃣ List Saved Cards

```javascript
const response = await fetch('/api/v1/payments/cards', {
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});

const cards = await response.json();

// Display cards in UI
cards.forEach(card => {
  console.log(`${card.cardBrand} ending in ${card.lastFour}`);
  // Example: "VISA ending in 1234"
});
```

---

### 3️⃣ Pay with Saved Card

```javascript
// User selects saved card and clicks "Pay"
const response = await fetch('/api/v1/payments/booking/saved-card', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    cardId: 1,                    // ID of saved card
    bookingId: 123,               // Booking to pay for
    paymentType: 'PARTIAL',       // or 'FULL'
    couponCode: 'SUMMER2024'      // Optional
  })
});

const { transactionId, chargeId } = await response.json();

// Payment processed immediately - no redirect needed!
// Check payment status via webhook or polling
```

---

### 4️⃣ Set Default Card

```javascript
// User marks a card as default
await fetch(`/api/v1/payments/cards/${cardId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    isDefault: true
  })
});

// This card will now be pre-selected in checkout
```

---

### 5️⃣ Delete Card

```javascript
// User clicks "Remove Card"
await fetch(`/api/v1/payments/cards/${cardId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});

// Card is permanently removed
```

---

## 🧪 Testing with Postman

### Save Card
```
POST http://localhost:3000/api/v1/payments/cards/verify
Headers:
  Authorization: Bearer YOUR_TOKEN
  Content-Type: application/json
Body:
{
  "setAsDefault": true
}
```

### Get Cards
```
GET http://localhost:3000/api/v1/payments/cards
Headers:
  Authorization: Bearer YOUR_TOKEN
```

### Pay with Saved Card
```
POST http://localhost:3000/api/v1/payments/booking/saved-card
Headers:
  Authorization: Bearer YOUR_TOKEN
  Content-Type: application/json
Body:
{
  "cardId": 1,
  "bookingId": 123,
  "paymentType": "PARTIAL"
}
```

---

## 🔐 Security Notes

✅ **We NEVER store:**
- Full card numbers
- CVV codes
- Complete expiry dates

✅ **We ONLY store:**
- Card token from Tap (`card_xxxxx`)
- First 6 digits (BIN)
- Last 4 digits
- Expiry month/year
- Card brand

✅ **All payments are:**
- Processed through Tap's secure gateway
- Protected by 3D Secure
- Validated against user ownership

---

## 📊 Example Card Display (UI)

```jsx
function SavedCardsList({ cards }) {
  return (
    <div>
      {cards.map(card => (
        <div key={card.id} className="card-item">
          <img src={`/icons/${card.cardBrand.toLowerCase()}.png`} />
          <span>•••• {card.lastFour}</span>
          <span>Expires {card.expiryMonth}/{card.expiryYear}</span>
          {card.isDefault && <badge>Default</badge>}
          <button onClick={() => deleteCard(card.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}
```

---

## ⚠️ Common Issues

### 1. Card not saved after payment
**Solution:** Check if:
- `save_card: true` is in Tap request
- `threeDSecure: true` is enabled
- Webhook URL is configured correctly
- Save Card feature is enabled in Tap dashboard

### 2. "Card verification failed"
**Solution:**
- Ensure 3D Secure is enabled in Tap
- Check if card supports 3D Secure
- Verify minimum amount (0.01 SAR) is allowed

### 3. Webhook not receiving data
**Solution:**
- Test webhook with Tap's test tool
- Check webhook URL is publicly accessible
- Verify SSL certificate is valid
- Check server logs for incoming requests

---

## 📞 Support

- **Tap Docs:** https://developers.tap.company
- **Tap Support:** support@tap.company
- **Feature Issues:** Check application logs

---

## ✅ Checklist Before Production

- [ ] Database migration executed
- [ ] Tap account configured (save card enabled)
- [ ] Webhook URL configured in Tap dashboard
- [ ] Environment variables set correctly
- [ ] Tested card save flow
- [ ] Tested payment with saved card
- [ ] SSL certificate valid for webhook
- [ ] Error handling tested
- [ ] Frontend UI implemented
- [ ] User can see/manage saved cards

---

Happy coding! 🎉
