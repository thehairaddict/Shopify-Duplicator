# Railway Deployment Guide

Complete guide for deploying Zenith Weave Shopify Store Duplicator to Railway.

## Prerequisites

- GitHub account
- Railway account (https://railway.app)
- Git installed locally

## Step 1: Prepare Your Repository

### 1.1 Initialize Git Repository

```bash
cd shopify-duplicator
git init
git add .
git commit -m "Initial commit: Zenith Weave Shopify Duplicator"
```

### 1.2 Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., `shopify-duplicator`)
3. Don't initialize with README (we already have one)

### 1.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/shopify-duplicator.git
git branch -M main
git push -u origin main
```

## Step 2: Create Railway Project

### 2.1 Sign Up / Login to Railway

1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project"

### 2.2 Deploy from GitHub

1. Select "Deploy from GitHub repo"
2. Choose your `shopify-duplicator` repository
3. Railway will detect the project structure

## Step 3: Add Database Services

### 3.1 Add PostgreSQL

1. In your Railway project, click "New Service"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically provision a PostgreSQL instance
4. Note: The `DATABASE_URL` environment variable is automatically set

### 3.2 Add Redis

1. Click "New Service" again
2. Select "Database" → "Redis"
3. Railway will provision a Redis instance
4. Note: The `REDIS_URL` environment variable is automatically set

## Step 4: Configure Backend Service

### 4.1 Add Backend Service

1. Click "New Service"
2. Select your GitHub repository
3. Set the following:
   - **Name**: `backend`
   - **Root Directory**: `backend`
   - **Build Command**: (auto-detected from Dockerfile)
   - **Start Command**: `npm start`

### 4.2 Set Environment Variables

In the backend service settings, add these environment variables:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<generate-random-64-char-string>
ENCRYPTION_KEY=<generate-random-64-char-hex-string>
SESSION_SECRET=<generate-random-64-char-string>
FRONTEND_URL=${{Frontend.RAILWAY_PUBLIC_DOMAIN}}
SHOPIFY_REST_MAX_REQUESTS_PER_SECOND=2
SHOPIFY_GRAPHQL_MAX_COST_PER_SECOND=50
BULL_CONCURRENCY=5
```

**Generate Secrets:**

```bash
# JWT Secret (64 characters)
openssl rand -base64 48

# Encryption Key (64 hex characters)
openssl rand -hex 32

# Session Secret (64 characters)
openssl rand -base64 48
```

### 4.3 Run Database Migrations

After the backend is deployed:

1. Go to backend service
2. Click "Settings" → "Deploy"
3. Add a deploy command or run manually:

```bash
npm run migrate
npm run seed
```

Or use Railway CLI:

```bash
railway run npm run migrate
railway run npm run seed
```

## Step 5: Configure Frontend Service

### 5.1 Add Frontend Service

1. Click "New Service"
2. Select your GitHub repository
3. Set the following:
   - **Name**: `frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Start Command**: (uses Dockerfile for production)

### 5.2 Set Environment Variables

```env
VITE_API_URL=https://${{Backend.RAILWAY_PUBLIC_DOMAIN}}
```

## Step 6: Configure Networking

### 6.1 Generate Public Domains

1. Go to each service (backend and frontend)
2. Click "Settings" → "Networking"
3. Click "Generate Domain"
4. Railway will provide a public URL (e.g., `your-app.up.railway.app`)

### 6.2 Update Environment Variables

After domains are generated:

1. Update backend's `FRONTEND_URL` with the frontend domain
2. Update frontend's `VITE_API_URL` with the backend domain
3. Redeploy both services

## Step 7: Verify Deployment

### 7.1 Check Backend Health

Visit: `https://your-backend.up.railway.app/health`

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-19T..."
}
```

### 7.2 Check Frontend

Visit: `https://your-frontend.up.railway.app`

You should see the login page.

### 7.3 Test Login

Use the seeded admin account:
- Email: `admin@zenithweave.com`
- Password: `admin123`

**⚠️ IMPORTANT: Change this password immediately in production!**

## Step 8: Custom Domain (Optional)

### 8.1 Add Custom Domain to Frontend

1. Go to frontend service → Settings → Networking
2. Click "Custom Domain"
3. Enter your domain (e.g., `app.yourdomain.com`)
4. Add the CNAME record to your DNS:
   ```
   CNAME: app.yourdomain.com → your-frontend.up.railway.app
   ```

### 8.2 Add Custom Domain to Backend

1. Go to backend service → Settings → Networking
2. Add custom domain (e.g., `api.yourdomain.com`)
3. Add CNAME record:
   ```
   CNAME: api.yourdomain.com → your-backend.up.railway.app
   ```

### 8.3 Update Environment Variables

Update with your custom domains:
- Backend `FRONTEND_URL`: `https://app.yourdomain.com`
- Frontend `VITE_API_URL`: `https://api.yourdomain.com`

## Step 9: Monitoring & Logs

### 9.1 View Logs

1. Go to any service
2. Click "Logs" tab
3. View real-time logs

### 9.2 Monitor Resources

1. Click "Metrics" tab
2. View CPU, Memory, Network usage

### 9.3 Set Up Alerts (Optional)

1. Go to Project Settings
2. Configure webhooks for deployment notifications
3. Integrate with Slack, Discord, etc.

## Step 10: Scaling (Optional)

### 10.1 Vertical Scaling

Railway automatically scales resources based on usage.

### 10.2 Horizontal Scaling

For high traffic:
1. Upgrade to Railway Pro plan
2. Enable horizontal scaling in service settings
3. Configure load balancing

## Troubleshooting

### Database Connection Issues

**Problem**: Backend can't connect to database

**Solution**:
```bash
# Check DATABASE_URL is set correctly
railway variables

# Verify PostgreSQL is running
railway service postgres logs

# Test connection
railway run npm run migrate
```

### Redis Connection Issues

**Problem**: Job queue not working

**Solution**:
```bash
# Check REDIS_URL
railway variables

# Verify Redis is running
railway service redis logs
```

### Frontend Can't Reach Backend

**Problem**: CORS errors or 404s

**Solution**:
1. Verify `FRONTEND_URL` in backend matches frontend domain
2. Verify `VITE_API_URL` in frontend matches backend domain
3. Check both services are deployed and running
4. Redeploy frontend after changing `VITE_API_URL`

### Migration Fails to Start

**Problem**: Jobs not processing

**Solution**:
1. Check Redis connection
2. Verify BullMQ worker is running (check backend logs)
3. Check Shopify API credentials are valid
4. Review migration logs in the UI

## Environment Variables Reference

### Backend

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection | Auto-set by Railway |
| `REDIS_URL` | Redis connection | Auto-set by Railway |
| `JWT_SECRET` | JWT signing secret | Random 64-char string |
| `ENCRYPTION_KEY` | Credential encryption key | Random 64-char hex |
| `SESSION_SECRET` | Session secret | Random 64-char string |
| `FRONTEND_URL` | Frontend URL for CORS | `https://app.example.com` |

### Frontend

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://api.example.com` |

## Cost Estimation

Railway pricing (as of 2024):

- **Hobby Plan** (Free): $5 credit/month
  - Good for testing
  - Limited resources

- **Developer Plan** ($5/month): $5 credit + usage
  - Suitable for small production
  - ~$10-20/month total

- **Pro Plan** ($20/month): $20 credit + usage
  - Production-ready
  - Better performance
  - ~$30-50/month total

**Resource Usage Estimate:**
- Backend: ~$5-10/month
- Frontend: ~$3-5/month
- PostgreSQL: ~$5-10/month
- Redis: ~$2-5/month

## Security Checklist

- [ ] Change default admin password
- [ ] Set strong JWT_SECRET
- [ ] Set strong ENCRYPTION_KEY
- [ ] Set strong SESSION_SECRET
- [ ] Enable HTTPS (automatic with Railway)
- [ ] Configure custom domains
- [ ] Set up monitoring alerts
- [ ] Review Shopify API scopes
- [ ] Implement rate limiting (already included)
- [ ] Regular database backups

## Backup Strategy

### Database Backups

Railway automatically backs up PostgreSQL databases.

**Manual Backup:**
```bash
railway run pg_dump $DATABASE_URL > backup.sql
```

**Restore:**
```bash
railway run psql $DATABASE_URL < backup.sql
```

### Configuration Backup

Export environment variables:
```bash
railway variables > env-backup.txt
```

## Support

**Zenith Weave Support:**
- Email: hi@zenithweave.com
- Phone: +201011400020

**Railway Support:**
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway

## Next Steps

1. ✅ Deploy to Railway
2. ✅ Configure custom domains
3. ✅ Change default credentials
4. ✅ Test migration with real stores
5. ✅ Set up monitoring
6. ✅ Configure backups
7. ✅ Review security settings

---

**Congratulations!** Your Shopify Store Duplicator is now live on Railway! 🚀
