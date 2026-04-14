# AURA Platform — Release Notes

**Version 1.1.0** · April 14, 2026
**Codename**: *Fulfilment*

---

## 🎯 Release Overview

This release transforms the AURA platform from a basic e-commerce store into a **complete retail operations system**. Three major capabilities have been introduced: a granular order fulfillment workflow, a real-time sales analytics dashboard, and full inventory stock management — spanning the API server, admin panel, and customer-facing storefront.

---

## ✦ What's New

### 1. 📦 Order Fulfillment Pipeline

A complete end-to-end order processing workflow, allowing administrators to track every stage of an order's lifecycle from receipt to delivery.

**Admin Panel**
- **9 predefined fulfillment steps** covering the standard pack-and-ship process:
  1. Order Confirmed
  2. Picking Items
  3. Quality Check
  4. Packing
  5. Label Printed
  6. Handed to Carrier
  7. In Transit
  8. Out for Delivery
  9. Delivered
- **"Add Step" modal** with two modes:
  - *Predefined Steps* — one-click to advance through the pipeline; already-completed steps are greyed out
  - *Custom Steps* — freeform status (Note, Issue, Custom) for special situations like gift wrapping or customer requests
- **Visual progress tracking** — percentage bar and chip-based pipeline view in the order detail panel
- **Full tracking timeline** — color-coded chronological event history with timestamps
- **Payment info section** — method and status displayed per order
- **Stat card filters** — click any stat (Pending, Processing, etc.) to filter the order table

**Customer Storefront**
- **Visual progress pipeline** — 4-step indicator bar (Pending → Processing → Shipped → Delivered)
- **Enhanced tracking timeline** — color-coded status labels with dot indicators per event
- **Cancelled order banner** — clear visual distinction for cancelled orders
- **Enriched info panel** — items count and last update date added
- **5-second real-time polling** — order status updates appear automatically

**API Server**
- `POST /api/orders/:id/tracking` — Push granular tracking events (predefined or custom); top-level status auto-updates when applicable

---

### 2. 📊 Sales Analytics Dashboard

A new dedicated analytics view in the admin panel providing insights into revenue, order volume, and product performance.

**KPI Summary Cards**
- Total Revenue with month-over-month growth indicator (↑/↓ %)
- Total Orders (all-time + current month)
- Total Items Sold (all-time + current month)
- Average Order Value

**Daily Revenue Chart**
- Interactive bar chart showing daily revenue for the current month
- Hover tooltips with day, revenue amount, and order count
- Today highlighted in blue; future days greyed out
- Responsive scaling based on highest revenue day

**Monthly Comparison**
- Horizontal bar chart comparing the last 4 months side-by-side
- Revenue, order count, items sold, and average order value per month
- Current month badge for quick identification

**Top Selling Products**
- Top 5 products ranked by total revenue generated
- Product image, revenue total, units sold, and relative revenue bar
- Rank badges (gold, silver, bronze styling)

**Per-Month Detail Cards**
- Expandable metrics grid at the bottom for quick reference

**API Server**
- `GET /api/analytics/sales` — Computes summary, 4-month breakdown, daily data points, and top products from order history

---

### 3. 🏷️ Inventory Stock Management

Full stock tracking lifecycle — from admin restocking through customer purchase to low-stock alerts.

**Admin Panel — Inventory View**
- **Inline stock editing** — click any stock number to edit in-place; press `Enter` to save, `Escape` to cancel
- **Stock status badges** per product:
  - 🟢 **In Stock** (> 10 units)
  - 🔵 **Limited** (4–10 units)
  - 🟡 **Low Stock** (1–3 units, animated pulse)
  - 🔴 **Out of Stock** (0 units)
- **Low stock alert banner** — appears at the top when any product has ≤ 3 units
- **New stat cards** — Stock Value (total inventory worth), Low Stock count, Out of Stock count
- **Row highlighting** — low stock products are visually tinted

**Admin Panel — Product Form**
- **Stock Qty field** added alongside Category and New Arrival toggle when creating or editing products

**Customer Storefront — Product Cards**
- `🔥 ONLY X LEFT` — animated gradient badge on products with ≤ 3 units remaining
- `SOLD OUT` — badge with greyed-out image and disabled VIEW button for 0-stock products

**Customer Storefront — Product Detail Modal (PDP)**
- **Stock indicator badge** — green/amber/red with text (e.g., "Hurry! Only 2 left")
- **Disabled ADD TO CART** button with "OUT OF STOCK" text and overlay when stock is 0

**API Server**
- `PATCH /api/products/:id/stock` — Admin endpoint to update stock quantity
- `GET /api/products/low-stock` — Returns products with 1–3 units (for potential "Almost Gone" client section)
- **Auto-decrement on order** — Stock is reduced for each item when a new order is placed

---

### 4. 🔧 Bug Fixes

- **Fixed OpenRouter API key** — The `OPENROUTER_API_KEY` in `server/.env` was split across two lines, causing the AI Stylist to fail with `401 Missing Authentication` errors. Merged onto a single line.

---

## 🗂️ Files Changed

### Server (`/server`)

| File | Change |
|------|--------|
| `src/models/Product.ts` | Added `stock: Number` field (default: 0) |
| `src/routes/orders.ts` | Added stock decrement on order creation; new `POST /:id/tracking` endpoint |
| `src/routes/products.ts` | New `PATCH /:id/stock` and `GET /low-stock` endpoints |
| `src/routes/analytics.ts` | **New** — Sales analytics computation endpoint |
| `src/index.ts` | Registered `/api/analytics` route |
| `.env` | Fixed `OPENROUTER_API_KEY` line split |

### Admin Panel (`/admin`)

| File | Change |
|------|--------|
| `src/App.tsx` | Added "Sales" tab in sidebar navigation |
| `src/lib/api.ts` | Added analytics types/fetch, stock update function, tracking event API |
| `src/components/OrdersView.tsx` | Complete rewrite — fulfillment pipeline, process modal, tracking timeline |
| `src/components/ProductsView.tsx` | Complete rewrite — inline stock editing, status badges, alert banner |
| `src/components/ProductForm.tsx` | Added Stock Qty field |
| `src/components/SalesView.tsx` | **New** — Full sales analytics dashboard |
| `src/index.css` | Added `fadeInUp` keyframe animation |

### Storefront (`/src`)

| File | Change |
|------|--------|
| `lib/api.ts` | Added `stock` and `isNewArrival` to Product interface |
| `components/ProductCard.tsx` | Low stock / sold out badges with visual states |
| `components/PDPModal.tsx` | Stock indicator, disabled add-to-cart, out-of-stock overlay |
| `pages/Account.tsx` | Visual progress pipeline, color-coded timeline, enhanced info panel |

---

## 📡 API Reference (New & Updated)

| Method | Endpoint | Status | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/orders/:id/tracking` | **New** | Add a tracking event (predefined or custom) |
| `PATCH` | `/api/products/:id/stock` | **New** | Update product stock quantity |
| `GET` | `/api/products/low-stock` | **New** | Get products with stock ≤ 3 |
| `GET` | `/api/analytics/sales` | **New** | Sales analytics (summary, monthly, daily, top products) |
| `PATCH` | `/api/orders/:id/status` | Updated | Now accepts optional `message` field |

---

## ⚠️ Migration Notes

- **Database**: The `Product` collection now includes a `stock` field. Existing products will default to `0` — **you should update stock quantities** for all products via the admin panel's Inventory tab after deployment.
- **No breaking changes** to existing API contracts. All new fields are optional or have defaults.

---

## 🔮 What's Next

- Email notifications on order status changes
- Automated low-stock reorder alerts
- Customer-facing "Almost Gone" section powered by `/api/products/low-stock`
- Export sales reports as PDF/CSV
- Role-based admin authentication

---

*Built with precision for the AURA ecosystem.*
