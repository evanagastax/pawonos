# Deploy PawonOS to Vercel + Railway

## Step 1: Deploy Backend (Railway)

1. Go to [railway.app](https://railway.app)
2. Create New Project → Deploy from GitHub repo
3. Select `evanagastax/pawonos`
4. Set root directory: `apps/api`
5. Add PostgreSQL database service
6. Set environment variables:
   ```
   DATABASE_URL=<from PostgreSQL service>
   JWT_SECRET=<generate 32+ char secret>
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   PORT=4000
   ```
7. Deploy → Note the URL (e.g., `https://pawonos-api.railway.app`)

## Step 2: Deploy Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com)
2. Import Project → Select `evanagastax/pawonos`
3. Set root directory: `apps/web`
4. Framework: Next.js
5. Set environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://pawonos-api.railway.app
   ```
6. Deploy

## Step 3: Seed Database

After Railway deploys, run seed:
1. Go to Railway → API service → Shell
2. Run: `npx prisma db seed`

## Step 4: Update CORS

Update `apps/api/src/main.ts`:
```typescript
app.enableCors({
  origin: "https://your-vercel-app.vercel.app",
  credentials: true,
});
```

## Step 5: Login

- URL: `https://your-vercel-app.vercel.app`
- Email: admin@pawonos.com
- Password: admin123

## Costs

- Vercel: Free tier (Hobby)
- Railway: ~$5-10/month
- PostgreSQL: Included in Railway

## Custom Domain

1. Vercel: Settings → Domains → Add
2. Railway: Settings → Domains → Generate