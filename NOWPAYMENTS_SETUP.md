# 🔐 NOWPAYMENTS SETUP GUIDE

## STEP 1: CREATE ACCOUNT

1. Go to https://nowpayments.io
2. Click "Sign Up"
3. Choose "Business Account"
4. Complete email verification

---

## STEP 2: GET YOUR WALLET ADDRESS

**IMPORTANT: You need a USDT (TRC20) wallet FIRST**

### Option A: Binance Wallet (Recommended)
1. Create Binance account
2. Go to Wallet → Fiat and Spot
3. Find USDT
4. Click Deposit
5. Select TRC20 network
6. Copy address (starts with T...)

### Option B: Trust Wallet
1. Download Trust Wallet app
2. Create wallet
3. Add USDT (TRC20)
4. Copy receive address

**SAVE THIS ADDRESS - NowPayments will send funds here**

---

## STEP 3: CONFIGURE NOWPAYMENTS

1. Login to NowPayments dashboard
2. Go to Settings → Payout Settings
3. Add your USDT (TRC20) address
4. Set auto-payout threshold: $100
5. Save settings

---

## STEP 4: GET API KEYS

1. Go to Settings → API Keys
2. Click "Generate API Key"
3. Copy your API Key
4. Copy your IPN Secret Key

**SAVE THESE - YOU'LL NEED THEM**

---

## STEP 5: CREATE PAYMENT LINK

### For Testing:
1. Go to Payment Tools → Payment Link
2. Set:
   - Price: $10
   - Currency: USD
   - Pay Currency: USDT (or leave auto)
   - Success URL: https://your-site.com/donate/success
   - Cancel URL: https://your-site.com/donate
3. Generate link
4. Test with small amount

---

## STEP 6: ADD TO BACKEND

In Railway environment variables:

```
NOWPAYMENTS_API_KEY=your-api-key-here
NOWPAYMENTS_IPN_SECRET=your-ipn-secret-here
```

---

## STEP 7: WEBHOOK SETUP

1. In NowPayments dashboard
2. Go to Settings → Webhooks (IPN)
3. Set IPN Callback URL:
   ```
   https://your-backend-url.railway.app/api/webhooks/nowpayments
   ```
4. Save

**When payment completes, NowPayments will notify your backend**

---

## STEP 8: INTEGRATE FRONTEND

Update donate page to create NowPayments invoice:

```javascript
const createPayment = async (amount, currency) => {
  const res = await fetch('https://api.nowpayments.io/v1/invoice', {
    method: 'POST',
    headers: {
      'x-api-key': 'YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      price_amount: amount,
      price_currency: currency,
      order_id: `BBOR-${Date.now()}`,
      order_description: 'Donation to BBOR',
      ipn_callback_url: 'https://your-backend.railway.app/api/webhooks/nowpayments',
      success_url: 'https://your-site.com/donate/success',
      cancel_url: 'https://your-site.com/donate'
    })
  })
  
  const data = await res.json()
  // Redirect user to: data.invoice_url
  window.location.href = data.invoice_url
}
```

---

## PAYMENT FLOW

**What user sees:**
1. User enters card details on NowPayments page
2. User pays (looks like regular payment)
3. Redirected to your success page

**What actually happens:**
1. Card → NowPayments
2. NowPayments → Converts to USDT
3. USDT → Your wallet
4. Webhook → Updates your database
5. Shows in admin as "$500 received"

**User never knows it's crypto!**

---

## FEES

- NowPayments: 1%
- Network fee: ~$1 (TRC20 USDT)
- **Total: ~1-2% depending on amount**

---

## TESTING

**Sandbox Mode:**
1. Use testnet
2. No real money
3. Test full flow

**Small Payment:**
1. Try $5 donation
2. Verify webhook works
3. Check USDT appears in wallet

---

## IMPORTANT NOTES

**Your wallet address:**
- MUST be TRC20 network
- NOT ERC20 (Ethereum - high fees)
- NOT other networks

**Auto-payout:**
- Set threshold (e.g., $100)
- NowPayments auto-sends when reached
- Or manual withdrawal anytime

**Conversion:**
- User pays USD/ZMW
- You receive USDT
- $1 = ~1 USDT

---

## NEXT STEPS

1. ✅ Create NowPayments account
2. ✅ Get USDT wallet
3. ✅ Get API keys
4. ✅ Add to backend ENV
5. ✅ Test payment flow
6. ✅ Go live

**Once this is done, card payments will work and you'll receive USDT automatically!**
