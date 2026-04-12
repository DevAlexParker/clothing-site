# AURA. — Premium Clothing E-Commerce

A full-stack e-commerce web application for a premium clothing brand, featuring a customer-facing storefront, a backend REST API with MongoDB, and a standalone admin panel for managing orders.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [License](#license)

---

## Overview

**AURA.** is a modern, glassmorphic e-commerce storefront designed for a Sri Lanka-based premium clothing brand. The project is split into three independent parts:

| Part | Description | Port |
|------|-------------|------|
| **Store Frontend** | Customer-facing shop where users browse products, add to cart, and place orders | `5173` |
| **API Server** | Node.js/Express REST API connected to MongoDB for products and orders | `5000` |
| **Admin Panel** | Standalone dashboard for managing incoming customer orders | `5174` |

### Key Features

- 🛍️ **Product Catalog** — Browse, filter by category & price range
- 🛒 **Cart & Checkout** — Add to cart, enter shipping & payment details, place orders
- 📦 **Order Processing** — Orders are saved to MongoDB and appear in the admin panel in real-time
- 📊 **Admin Dashboard** — View all orders, update statuses (Pending → Processing → Shipped → Delivered), auto-refreshes every 30 seconds
- ✨ **Premium UI** — Glassmorphism design, 3D card hover effects, smooth animations, loading skeletons

---

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Store (React)  │         │  Admin (React)   │
│    port: 5173    │         │   port: 5174     │
│                  │         │                  │
│  Browse products │         │  View orders     │
│  Place orders    │         │  Update status   │
└──────┬──────────┘         └──────┬──────────┘
       │ GET /api/products         │ GET /api/orders
       │ POST /api/orders          │ PATCH /api/orders/:id/status
       │                           │
       └───────────┬───────────────┘
                   │
          ┌────────▼────────┐
          │  Express API     │
          │   port: 5000     │
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │    MongoDB       │
          │ aura_clothing DB │
          └─────────────────┘
```

---

## Folder Structure

```
clothing-site/
│
├── server/                          # 🖥️ Backend API Server
│   ├── .env                         # ⚠️ Local only (gitignored) — MongoDB URI & port
│   ├── .env.example                 # Template for .env — committed to git
│   ├── package.json                 # Server dependencies
│   ├── tsconfig.json                # TypeScript config
│   └── src/
│       ├── index.ts                 # Express entry point — middleware, routes, server start
│       ├── db.ts                    # MongoDB/Mongoose connection helper
│       ├── seed.ts                  # Seed script — populates products collection
│       ├── models/
│       │   ├── Product.ts           # Mongoose Product schema & model
│       │   └── Order.ts            # Mongoose Order schema & model
│       └── routes/
│           ├── products.ts          # GET /api/products, GET /api/products/:id
│           └── orders.ts            # POST, GET, PATCH /api/orders
│
├── src/                             # 🛍️ Store Frontend (Vite + React)
│   ├── main.tsx                     # React entry point
│   ├── App.tsx                      # Root component — routing, cart state, footer
│   ├── App.css                      # Legacy CSS (Vite template)
│   ├── index.css                    # TailwindCSS config — theme, glass utilities
│   ├── data.ts                      # Type re-exports & formatPrice utility
│   ├── lib/
│   │   └── api.ts                   # API helpers — fetchProducts(), createOrder()
│   ├── components/
│   │   ├── Navbar.tsx               # Top navigation bar with cart badge
│   │   ├── ProductCard.tsx          # Product card with 3D hover effect
│   │   ├── PDPModal.tsx             # Product detail modal — color/size selectors
│   │   └── CartFlyout.tsx           # Slide-out cart → checkout → order confirmation
│   ├── pages/
│   │   ├── Home.tsx                 # Hero section + featured products grid
│   │   ├── Collections.tsx          # All products with category/price filters
│   │   └── About.tsx                # Brand story page
│   └── assets/
│       └── hero.png                 # Hero image asset
│
├── admin/                           # 📊 Admin Panel (Vite + React)
│   ├── .env                         # ⚠️ Local only (gitignored) — API URL
│   ├── .env.example                 # Template for .env — committed to git
│   ├── index.html                   # HTML entry
│   ├── package.json                 # Admin dependencies
│   ├── vite.config.ts               # Vite config — port 5174, TailwindCSS
│   ├── tsconfig.json                # TypeScript config
│   └── src/
│       ├── main.tsx                 # React entry point
│       ├── App.tsx                  # Admin dashboard — order table, detail panel, stats
│       ├── index.css                # TailwindCSS config — admin theme
│       └── lib/
│           └── api.ts               # API helpers — fetchOrders(), updateOrderStatus()
│
├── public/                          # Static assets (favicon, icons)
│   ├── favicon.svg
│   └── icons.svg
│
├── .env                             # ⚠️ Local only (gitignored) — Store API URL
├── .env.example                     # Template for .env — committed to git
├── index.html                       # Store HTML entry
├── package.json                     # Store dependencies
├── vite.config.ts                   # Store Vite config — TailwindCSS
├── tsconfig.json                    # Root TypeScript config
├── tsconfig.app.json                # App-specific TS config
├── tsconfig.node.json               # Node-specific TS config
├── eslint.config.js                 # ESLint configuration
├── .gitignore                       # Git ignore rules
└── README.md                        # This file
```

---

## Prerequisites

Before running the project, make sure you have the following installed:

- **Node.js** (v18 or higher) — [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB** — Choose one option:
  - **Local**: [MongoDB Community Server](https://www.mongodb.com/try/download/community)
  - **Cloud (Free)**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) — Create a free M0 cluster

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/clothing-site.git
cd clothing-site
```

### 2. Install Dependencies

You need to install dependencies for all three parts:

```bash
# Store frontend
npm install

# API server
cd server
npm install

# Admin panel
cd ../admin
npm install

cd ..
```

### 3. Configure Environment Variables

Each part of the project has its own `.env` file. Copy the provided `.env.example` templates:

```bash
# Server
cp server/.env.example server/.env

# Store frontend
cp .env.example .env

# Admin panel
cp admin/.env.example admin/.env
```

> **On Windows (PowerShell):**
> ```powershell
> Copy-Item server\.env.example server\.env
> Copy-Item .env.example .env
> Copy-Item admin\.env.example admin\.env
> ```

Then edit each `.env` file as needed:

| File | Variables | Purpose |
|------|-----------|----------|
| `server/.env` | `MONGODB_URI`, `PORT` | MongoDB connection string and API port |
| `.env` | `VITE_API_URL` | Backend API URL for the store frontend |
| `admin/.env` | `VITE_API_URL` | Backend API URL for the admin panel |

> **Note:** If using MongoDB Atlas instead of local MongoDB, update the `MONGODB_URI` in `server/.env` with your Atlas connection string.

### 4. Seed the Database

Run this once to populate the products collection with sample data (11 products):

```bash
cd server
npm run seed
```

You should see:
```
✅ Connected to MongoDB
🗑️  Cleared existing products
✅ Seeded 11 products into MongoDB
```

### 5. Start All Services

Open **three separate terminal windows**:

```bash
# Terminal 1 — API Server
cd server
npm run dev
# → http://localhost:5000

# Terminal 2 — Store Frontend
cd clothing-site
npm run dev
# → http://localhost:5173

# Terminal 3 — Admin Panel
cd admin
npm run dev
# → http://localhost:5174
```

### 6. Test the Flow

1. Open **http://localhost:5173** — Browse products, add to cart, and place an order
2. Open **http://localhost:5174** — See the order appear, click it, and update the status

---

## API Reference

Base URL: `http://localhost:5000`

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | Get all products |
| `GET` | `/api/products/:id` | Get a single product by ID |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/orders` | Create a new order |
| `GET` | `/api/orders` | Get all orders (newest first) |
| `GET` | `/api/orders/:id` | Get a single order by order ID |
| `PATCH` | `/api/orders/:id/status` | Update an order's status |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server health check |

#### Example: Create Order

```json
POST /api/orders
Content-Type: application/json

{
  "orderId": "AURA-123456",
  "customerInfo": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "addressLine1": "123 Main Street",
    "city": "Colombo",
    "postalCode": "00300"
  },
  "items": [
    {
      "productId": "abc123",
      "productName": "Minimalist Overcoat",
      "productImage": "https://...",
      "productPrice": 45000,
      "quantity": 1,
      "selectedSize": "M",
      "selectedColor": "Camel"
    }
  ],
  "totalAmount": 45000
}
```

#### Example: Update Order Status

```json
PATCH /api/orders/AURA-123456/status
Content-Type: application/json

{
  "status": "Shipped"
}
```

Valid statuses: `Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`

---

## Tech Stack

### Frontend (Store & Admin)
- **React 19** — UI library
- **TypeScript** — Type safety
- **Vite** — Build tool & dev server
- **TailwindCSS v4** — Utility-first CSS framework

### Backend
- **Node.js** — Runtime
- **Express 5** — Web framework
- **Mongoose** — MongoDB object modeling
- **MongoDB** — NoSQL database

### Development Tools
- **tsx** — TypeScript execution for Node.js
- **ESLint** — Code linting
- **dotenv** — Environment variable management

---

## Scripts Reference

### Store (`/`)
| Script | Command | Description |
|--------|---------|-------------|
| Dev server | `npm run dev` | Start store on port 5173 |
| Build | `npm run build` | Production build |
| Preview | `npm run preview` | Preview production build |
| Lint | `npm run lint` | Run ESLint |

### Server (`/server`)
| Script | Command | Description |
|--------|---------|-------------|
| Dev server | `npm run dev` | Start API with hot reload on port 5000 |
| Seed DB | `npm run seed` | Populate MongoDB with sample products |
| Build | `npm run build` | Compile TypeScript |
| Start | `npm run start` | Run compiled JS (production) |

### Admin (`/admin`)
| Script | Command | Description |
|--------|---------|-------------|
| Dev server | `npm run dev` | Start admin on port 5174 |
| Build | `npm run build` | Production build |
| Preview | `npm run preview` | Preview production build |

---

## License

This project is for educational and demonstration purposes.
