# 🚂 RAILWAY DEPLOYMENT GUIDE

## STEP 1: CREATE POSTGRESQL DATABASE

1. Go to https://railway.app
2. Click "New Project"
3. Click "Provision PostgreSQL"
4. Wait for database to be created
5. Click on PostgreSQL service
6. Go to "Variables" tab
7. Copy the `DATABASE_URL` (starts with `postgresql://`)

**Save this URL - you'll need it!**

---

## STEP 2: DEPLOY BACKEND

### Option A: Deploy from GitHub (Recommended)

1. Push backend code to GitHub
2. In Railway, click "New" → "GitHub Repo"
3. Select your backend repository
4. Railway will auto-detect Node.js

### Option B: Deploy from CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Deploy
railway up
```

---

## STEP 3: SET ENVIRONMENT VARIABLES

In Railway dashboard:

1. Click on your backend service
2. Go to "Variables" tab
3. Add these variables:

```
DATABASE_URL = [paste from PostgreSQL service]
JWT_SECRET = [generate random string - use: openssl rand -hex 32]
NOWPAYMENTS_API_KEY = [your NowPayments key - add later]
NOWPAYMENTS_IPN_SECRET = [your NowPayments IPN secret - add later]
PORT = 3001
NODE_ENV = production
FRONTEND_URL = https://your-frontend-url.vercel.app
```

---

## STEP 4: RUN DATABASE MIGRATIONS

In Railway dashboard:

1. Click backend service
2. Go to "Settings" tab
3. Add to "Build Command":
   ```
   npm install && npx prisma generate && npx prisma migrate deploy
   ```

4. Add to "Start Command":
   ```
   node server.js
   ```

5. Click "Deploy"

---

## STEP 5: SEED DATABASE

After deployment:

1. Go to backend service
2. Click "..." menu → "Run Command"
3. Run:
   ```
   node prisma/seed.js
   ```

**This creates:**
- Admin user: `admin@bbor.org` / `bbor2026admin`
- Sample causes, FAQs, stories, news

---

## STEP 6: GET YOUR BACKEND URL

1. Go to backend service
2. Click "Settings"
3. Under "Domains", you'll see your Railway URL
4. Example: `bbor-backend-production.up.railway.app`

**Save this URL - frontend needs it!**

---

## STEP 7: TEST BACKEND

Visit: `https://your-backend-url.railway.app/health`

Should see:
```json
{
  "status": "ok",
  "timestamp": "2026-02-10T..."
}
```

---

## TROUBLESHOOTING

### Database connection failed?
- Check `DATABASE_URL` is correct
- Make sure PostgreSQL service is running

### Migration errors?
- Run manually: `npx prisma migrate deploy`
- Check Prisma schema is correct

### Build fails?
- Check `package.json` is correct
- Verify Node.js version (use 18.x or higher)

### Can't access backend?
- Check Railway gave you a public domain
- Verify CORS settings in `server.js`

---

## IMPORTANT NOTES

**Your backend URL will be:**
`https://[your-service-name].up.railway.app`

**Update frontend .env:**
```
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```

**Database is persistent:**
- Data won't be lost
- Automatic backups by Railway
- Can view data in Railway dashboard

---

## COSTS

**Railway Free Tier:**
- $5 free credit/month
- PostgreSQL: ~$5/month after free tier
- Backend: ~$5/month
- **Total: ~$10/month** (first month free)

---

## NEXT STEPS

1. ✅ Deploy backend to Railway
2. ✅ Get backend URL
3. ✅ Update frontend with API URL
4. ✅ Test login at `/admin`
5. ✅ Add NowPayments keys when ready

**Backend will be live 24/7 on Railway!**
