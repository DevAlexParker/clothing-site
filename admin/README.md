# 📊 AURA Admin Dashboard

A dedicated management portal for the AURA Clothing storefront. Allows administrators to track, view, and update customer orders in real-time.

## 🛠️ Tech Stack
- **React 19**: Modern UI library.
- **Vite**: Ultra-fast build tool.
- **Tailwind CSS v4**: Utility-first styling with custom admin themes.
- **TypeScript**: Ensuring data integrity across the dashboard.

## ✨ Features
- **Order Overview**: Real-time list of all customer orders.
- **Status Management**: Update order lifecycle (Pending → Processing → Shipped → Delivered).
- **Infinite Refresh**: Auto-syncs with the backend to ensure no order is missed.
- **Responsive Design**: Manage your store from any device.

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Environment Variables
Create a `.env` file with:
```env
VITE_API_URL=http://localhost:5000
```

### Scripts
- `npm run dev`: Start the admin dashboard on port 5174.
- `npm run build`: Generate production bundle.
- `npm run preview`: Preview the production build locally.

---
*Note: Ensure the API server is running to allow the dashboard to fetch data.*
