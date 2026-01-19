<p align="center">
  <img src="https://zenithweave.com/wp-content/uploads/2026/01/Untitled-design.jpg" width="140" alt="Zenith Weave Logo" />
</p>

<h1 align="center">Shopify-Duplicator</h1>

<p align="center">
  <b>Duplicate an entire Shopify store — safely, selectively, and professionally.</b>
</p>

<p align="center">
  Built with ❤️ by <b>Zenith Weave</b>
</p>

<p align="center">
  <a href="https://zenithweave.com">🌐 Website</a> •
  <a href="mailto:hi@zenithweave.com">📧 hi@zenithweave.com</a> •
  <a href="tel:+201011400020">📞 +20 101 140 0020</a>
</p>

---

## 🚀 Overview

**Shopify-Duplicator** is a production-ready web application that enables you to **clone a Shopify store** into another Shopify store with full control, real-time progress tracking, and safe Shopify API handling.

Designed for **agencies, developers, and enterprise teams**, this tool eliminates manual duplication while preserving all essential storefront data.

> ⚠️ Shopify store settings (payments, shipping, taxes, etc.) are intentionally excluded and must be configured manually.

---

## ✨ Key Features

### 🧩 Selective Migration
Choose exactly what you want to duplicate:
- Themes
- Products
- Collections
- Pages
- Media files

### 📊 Live Progress Tracking
- Module-level progress bars
- Global migration progress
- Real-time logs
- Estimated remaining time

### 🔐 Secure Credentials
- Encrypted storage
- Separate source & destination credentials
- No hardcoded secrets

### 🎨 Stunning Dashboard
- ☀️ Light Mode
- 🌙 Cyberpunk Dark Mode
- Responsive & mobile-friendly
- Zenith Weave branding

---

## 📦 What Gets Migrated

| Module        | Included |
|--------------|----------|
| 🎨 Theme      | Active theme only (sections, assets, templates, settings) |
| 🛍 Products   | Products, variants, images, pricing, metafields |
| 📂 Collections| Smart & manual collections, rules, images |
| 📄 Pages      | Content, templates, handles |
| 🖼 Media      | Files uploaded to Shopify Files |

### ❌ Not Included (Manual Setup)
- Orders
- Customers
- Payments
- Shipping
- Taxes
- Store settings

---

## 🏗️ Tech Stack

### Backend
- Node.js (Express)
- Shopify Admin API (REST + GraphQL)
- BullMQ (background jobs)
- PostgreSQL

### Frontend
- React (Vite / Next.js)
- Tailwind CSS
- Dark / Light mode support

### Infrastructure
- Railway
- Docker
- GitHub Repository

---

## 🧠 Architecture Overview

```txt
├── backend/
│   ├── services/
│   │   ├── ThemeMigrator
│   │   ├── ProductMigrator
│   │   ├── CollectionMigrator
│   │   ├── PageMigrator
│   │   └── MediaMigrator
│   ├── jobs/
│   ├── controllers/
│   └── routes/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── themes/
│   └── utils/
│
├── docker/
├── README.md
└── docker-compose.yml
