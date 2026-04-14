# ✧ AURA. — Premium Clothing E-Commerce

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

**AURA.** is a sophisticated, full-stack e-commerce ecosystem designed for premium brands. It offers a cinematic, glassmorphic shopping experience, a robust Express-based API, and a real-time administrative dashboard for order management.

---

## ✦ Key Highlights

- 💎 **Premium Aesthetic** — High-end glassmorphism, 3D hover effects, and fluid animations.
- 🛍️ **Immersive Shopping** — Interactive product catalog with dynamic filtering and sizing.
- 💳 **Stripe Integration** — Secure, localized payment flow with rich animations.
- 📊 **Real-time Admin** — Integrated dashboard for order tracking and status management.
- ⚡ **Modern Stack** — Built with React 19, Vite, Express 5, and Mongoose.

---

## 🏗️ Architecture

The system is composed of three decoupled core services:

| Component | Path | Tech Stack | Responsibility |
| :--- | :--- | :--- | :--- |
| **Storefront** | `/` | React + Vite | Customer-facing catalog & checkout |
| **Admin Panel** | `/admin` | React + Vite | Order management & status updates |
| **API Server** | `/server` | Node + Express | Backend logic, DB & Payments |

---

## 📂 Project Structure

```bash
clothing-site/
├── server/            # 🖥️ Node/Express API & MongoDB integration
│   ├── src/models     # Database schemas (Product, Order)
│   ├── src/routes     # REST API endpoints
│   └── src/seed.ts    # Database population script
├── admin/             # 📊 Standalone Order Management Dashboard
│   ├── src/components # UI components for admin tasks
│   └── src/lib/api.ts # API interaction layer
├── src/               # 🛍️ Storefront Application (Client)
│   ├── components/    # Reusable UI (Navbar, Cards, Modals)
│   ├── pages/         # View logic (Home, Collections)
│   └── index.css      # Core design system & glassmorphism
└── public/            # Static assets & brand identity
```

---

## 🚀 Quick Start

### 1. Prerequisites
Ensure you have **Node.js (v18+)** and a **MongoDB** instance (Local or Atlas) ready.

### 2. Installations
Run the following from the root directory:

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install admin dependencies
cd admin && npm install && cd ..
```

### 3. Environment Setup
Copy the `.env.example` files in each directory to `.env` and configure your credentials.

- **Server**: `MONGODB_URI`, `STRIPE_SECRET_KEY`, `PORT`
- **Storefront**: `VITE_API_URL`, `VITE_STRIPE_PUBLIC_KEY`
- **Admin**: `VITE_API_URL`

### 4. Seed Database
Populate your MongoDB with high-quality sample data:
```bash
cd server
npm run seed
```

### 5. Running the Application
Launch all services in development mode (requires multiple terminals):

```bash
# Terminal 1: API Server
cd server && npm run dev

# Terminal 2: Storefront
npm run dev

# Terminal 3: Admin Panel
cd admin && npm run dev
```

---

## 🔌 API Reference (Preview)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/products` | Retrieve all featured products |
| `POST` | `/api/orders` | Create a new customer order |
| `PATCH` | `/api/orders/:id/status` | Update order (Admin only) |

---

## 🎨 Design System
AURA follows a **Cinematic Minimalist** design language:
- **Font**: *Inter* for maximum readability.
- **Glassmorphism**: `.glass-panel` and `.glass-card` utilities for transparency and blur.
- **3D Interaction**: `perspective-1000` for deep hover interactions.

---

## ⚖️ License
This project is provided for demonstration and educational purposes. All brand assets are reserved.
