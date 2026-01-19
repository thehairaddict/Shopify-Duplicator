# 🚀 Quick Start Guide

Get your Shopify Store Duplicator running in minutes!

## 📋 Prerequisites

- Node.js 18+ installed
- Docker & Docker Compose installed
- Git installed
- Shopify store credentials (API key, secret, access token)

## 🏃 Local Development Setup

### 1. Clone & Install

```bash
cd shopify-duplicator

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

**Backend** (`backend/.env`):
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://shopify_user:shopify_pass@localhost:5432/shopify_duplicator
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-jwt-secret-change-in-production
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
SESSION_SECRET=dev-session-secret
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000
```

### 3. Start with Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access the app:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 4. Manual Setup (Alternative)

**Start PostgreSQL & Redis:**
```bash
# PostgreSQL
docker run -d --name shopify-postgres \
  -e POSTGRES_USER=shopify_user \
  -e POSTGRES_PASSWORD=shopify_pass \
  -e POSTGRES_DB=shopify_duplicator \
  -p 5432:5432 postgres:14-alpine

# Redis
docker run -d --name shopify-redis \
  -p 6379:6379 redis:7-alpine
```

**Run Database Migrations:**
```bash
cd backend
npm run migrate
npm run seed
```

**Start Backend:**
```bash
cd backend
npm run dev
```

**Start Frontend (new terminal):**
```bash
cd frontend
npm run dev
```

### 5. Login

Open http://localhost:5173 and login with:
- **Email**: `admin@zenithweave.com`
- **Password**: `admin123`

⚠️ **Change this password immediately!**

## 🎯 First Migration

### Step 1: Add Stores

1. Navigate to **Stores** page
2. Click **Add Store**
3. Fill in Shopify credentials:
   - **Store Name**: My Source Store
   - **Store URL**: `mystore.myshopify.com`
   - **API Key**: Your Shopify API key
   - **API Secret**: Your Shopify API secret
   - **Access Token**: Your Shopify access token
   - **Store Type**: Source
4. Click **Test** to verify connection
5. Repeat for destination store (set type to "Destination")

### Step 2: Start Migration

1. Navigate to **Migrations** page
2. Click **New Migration**
3. Select source and destination stores
4. Choose modules to migrate:
   - ✅ Theme
   - ✅ Products
   - ✅ Collections
   - ✅ Pages
   - ✅ Media Files
5. Click **Start Migration**

### Step 3: Monitor Progress

- View real-time progress bars
- Watch live logs
- See module-by-module completion
- Download report when complete

## 🔑 Getting Shopify API Credentials

### Create a Custom App

1. Go to your Shopify admin
2. Navigate to **Settings** → **Apps and sales channels**
3. Click **Develop apps**
4. Click **Create an app**
5. Name it "Store Duplicator"
6. Click **Configure Admin API scopes**

### Required Scopes

Select these scopes:

**Products:**
- `read_products`
- `write_products`

**Collections:**
- `read_collections`
- `write_collections`

**Content:**
- `read_content`
- `write_content`

**Themes:**
- `read_themes`
- `write_themes`

**Files:**
- `read_files`
- `write_files`

### Get Credentials

1. Click **Install app**
2. Copy the **Admin API access token** (you'll only see this once!)
3. Go to **API credentials** tab
4. Copy **API key** and **API secret key**

## 🎨 UI Features

### Light Mode
Clean, professional SaaS interface with high contrast.

### Dark Mode (Cyberpunk)
- Neon cyan (#00f0ff) and purple (#b026ff) accents
- Dark background (#0b0f19)
- Glow effects on buttons and borders
- Futuristic aesthetic

Toggle with the sun/moon icon in the header.

## 📊 Monitoring

### View Logs

**Backend logs:**
```bash
docker-compose logs -f backend
```

**Frontend logs:**
```bash
docker-compose logs -f frontend
```

### Database Access

```bash
docker exec -it shopify-duplicator-db psql -U shopify_user -d shopify_duplicator
```

### Redis CLI

```bash
docker exec -it shopify-duplicator-redis redis-cli
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :3000  # Backend
lsof -i :5173  # Frontend
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Kill the process
kill -9 <PID>
```

### Database Connection Error

```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres
cd backend
npm run migrate
npm run seed
```

### Migration Not Starting

1. Check Redis is running: `docker ps | grep redis`
2. Check backend logs: `docker-compose logs backend`
3. Verify Shopify credentials are correct
4. Test store connection in UI

### CORS Errors

Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL.

## 📁 Project Structure

```
shopify-duplicator/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration
│   │   ├── database/        # DB schema & migrations
│   │   ├── middleware/      # Auth & validation
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   │   ├── migrators/   # Migration modules
│   │   │   ├── queue/       # BullMQ workers
│   │   │   └── shopify/     # Shopify API client
│   │   └── utils/           # Helpers
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # Auth, Theme, Socket
│   │   ├── pages/           # Page components
│   │   └── services/        # API client
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── README.md
├── DEPLOYMENT.md            # Railway deployment guide
└── API_DOCUMENTATION.md     # Complete API reference
```

## 🚀 Deploy to Production

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for complete Railway deployment instructions.

**Quick Deploy:**

1. Push to GitHub
2. Connect to Railway
3. Add PostgreSQL & Redis services
4. Configure environment variables
5. Deploy!

## 📚 Documentation

- **[README.md](./README.md)** - Project overview
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Railway deployment guide
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference
- **[QUICKSTART.md](./QUICKSTART.md)** - This guide

## 🆘 Support

**Zenith Weave**
- 📧 Email: hi@zenithweave.com
- 📞 Phone: +201011400020

## ✅ Next Steps

1. ✅ Complete local setup
2. ✅ Add your Shopify stores
3. ✅ Test with a small migration
4. ✅ Review the migration report
5. ✅ Deploy to Railway
6. ✅ Configure custom domain
7. ✅ Set up monitoring

---

**Happy Migrating! 🎉**
