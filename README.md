# Zenith Weave - Shopify Store Duplicator

A production-ready web application for duplicating Shopify stores with granular control, real-time progress tracking, and safe API usage.

## 🚀 Features

- **Complete Store Migration**: Themes, Products, Collections, Pages, and Media Files
- **Granular Control**: Select exactly what to migrate
- **Real-time Progress**: Live progress tracking with WebSocket updates
- **Background Processing**: Non-blocking job queue with BullMQ
- **Rate Limit Safe**: Intelligent Shopify API rate limiting
- **Idempotent Operations**: Resume interrupted migrations
- **Cyberpunk UI**: Beautiful dark mode with neon accents
- **Production Ready**: Docker-optimized for Railway deployment

## 🏗️ Tech Stack

### Backend
- Node.js + Express
- PostgreSQL (database)
- BullMQ + Redis (job queue)
- Shopify Admin API (REST + GraphQL)
- Socket.io (real-time updates)
- bcrypt (password hashing)
- crypto (credential encryption)

### Frontend
- React + Vite
- TailwindCSS
- Lucide Icons
- Socket.io Client
- Axios

### DevOps
- Docker + Docker Compose
- Railway (hosting)
- PostgreSQL (managed)
- Redis (managed)

## 📦 What Gets Migrated

### ✅ Included
- **Theme**: Active theme with all customizations, sections, settings
- **Products**: Products, variants, images, prices, inventory tracking, metafields
- **Collections**: Smart & manual collections, rules, images, descriptions
- **Pages**: Content, templates, handles
- **Media Files**: All files uploaded to destination

### ❌ Excluded
- Orders
- Customers
- Store settings
- Payment configurations
- Shipping configurations

## 🏃 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+
- Redis 7+

### Local Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd shopify-duplicator
```

2. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run migrate
npm run seed
npm run dev
```

3. **Setup Frontend**
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with backend URL
npm run dev
```

4. **Using Docker Compose**
```bash
docker-compose up -d
```

Access the application at `http://localhost:5173`

## 🚂 Railway Deployment

### Step 1: Prepare Repository
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

### Step 2: Create Railway Project
1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

### Step 3: Add Services

**PostgreSQL Database:**
1. Click "New Service"
2. Select "Database" → "PostgreSQL"
3. Note the connection details

**Redis:**
1. Click "New Service"
2. Select "Database" → "Redis"
3. Note the connection details

**Backend Service:**
1. Click "New Service"
2. Select your repository
3. Set Root Directory: `backend`
4. Add environment variables:
```
NODE_ENV=production
PORT=3000
DATABASE_URL=${POSTGRES_URL}
REDIS_URL=${REDIS_URL}
JWT_SECRET=<generate-random-secret>
ENCRYPTION_KEY=<generate-32-byte-hex-key>
FRONTEND_URL=https://<your-frontend-domain>
```

**Frontend Service:**
1. Click "New Service"
2. Select your repository
3. Set Root Directory: `frontend`
4. Add environment variables:
```
VITE_API_URL=https://<your-backend-domain>
```

### Step 4: Deploy
Railway will automatically deploy on every push to main branch.

## 🔐 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/shopify_duplicator
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-this
ENCRYPTION_KEY=your-32-byte-hex-encryption-key
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=your-session-secret
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
```

## 📊 Database Schema

See `backend/src/database/schema.sql` for complete schema.

Key tables:
- `users` - User accounts
- `stores` - Shopify store credentials (encrypted)
- `migrations` - Migration jobs and progress
- `migration_logs` - Detailed operation logs
- `migration_items` - Individual item tracking for idempotency

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Stores
- `GET /api/stores` - List user's stores
- `POST /api/stores` - Add new store
- `PUT /api/stores/:id` - Update store
- `DELETE /api/stores/:id` - Delete store
- `POST /api/stores/:id/test` - Test connection

### Migrations
- `POST /api/migrations/start` - Start new migration
- `GET /api/migrations` - List migrations
- `GET /api/migrations/:id` - Get migration details
- `PUT /api/migrations/:id/pause` - Pause migration
- `PUT /api/migrations/:id/resume` - Resume migration
- `DELETE /api/migrations/:id/cancel` - Cancel migration
- `GET /api/migrations/:id/logs` - Get migration logs
- `GET /api/migrations/:id/export` - Export report

### WebSocket
- `ws://localhost:3000` - Real-time progress updates

## 🎨 UI Features

### Light Mode
- Clean, professional SaaS interface
- High contrast for readability
- Enterprise-grade design

### Dark Mode (Cyberpunk)
- Background: `#0b0f19`
- Neon accents: Cyan (`#00f0ff`) and Purple (`#b026ff`)
- Glow effects on interactive elements
- Futuristic typography

## 🔧 Architecture

### Migration Flow
1. User configures source and destination stores
2. User selects modules to migrate
3. System validates API access
4. Migration job created in database
5. Jobs queued in BullMQ
6. Workers process with rate limiting
7. Real-time progress via WebSocket
8. Completion report generated

### Rate Limiting
- Shopify REST API: 2 req/sec (burst: 40)
- Shopify GraphQL: 50 points/sec
- Automatic retry with exponential backoff
- 429 error handling

### Idempotency
- Each item tracked in `migration_items`
- Duplicate detection via source_id
- Resume capability for interrupted migrations

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📝 Migration Modules

### ThemeMigrator
- Downloads active theme from source
- Uploads to destination
- Preserves all settings and customizations

### ProductMigrator
- Migrates products with variants
- Handles images and metafields
- Preserves inventory tracking settings

### CollectionMigrator
- Migrates smart and manual collections
- Preserves collection rules
- Handles collection images

### PageMigrator
- Migrates page content
- Preserves templates and handles

### MediaMigrator
- Uploads all media files
- Maintains original filenames
- Handles large file uploads

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
psql $DATABASE_URL
```

### Redis Connection Issues
```bash
# Check Redis is running
docker ps | grep redis

# Test connection
redis-cli ping
```

### Shopify API Errors
- Verify API credentials are correct
- Check API access scopes
- Ensure store URLs are valid (format: `mystore.myshopify.com`)

## 📞 Support

**Zenith Weave**
- Email: hi@zenithweave.com
- Phone: +201011400020

## 📄 License

Proprietary - All rights reserved

## 🙏 Credits

Built with ❤️ by Zenith Weave
