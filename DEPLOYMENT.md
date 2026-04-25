# 🚀 Hosting AURA Clothing Platform for FREE

This guide will walk you through deploying your entire platform (Storefront, Admin Panel, and Backend API) for free using industry-standard tools.

---

## 1. Prerequisites
- A **GitHub** account.
- Your code pushed to a GitHub repository.
- A **MongoDB Atlas** account (for the database).

---

## 2. Step 1: Database (MongoDB Atlas)
1.  Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  Create a **New Project** named "AURA".
3.  Click **Build a Cluster** and choose the **FREE Shared Tier**.
4.  Select a region close to you (e.g., AWS / N. Virginia).
5.  **Security Quickstart**:
    *   Create a Database User (keep the username and password safe).
    *   Add your current IP address to the IP Access List (or `0.0.0.0/0` to allow access from anywhere, including your hosting providers).
6.  Go to **Database** -> **Connect** -> **Drivers**.
7.  Copy the **Connection String** (it looks like `mongodb+srv://<db_user>:<db_password>@cluster.mongodb.net/...`).

---

## 3. Step 2: Backend API (Render.com)
Render is the best free option for hosting Node.js APIs.

1.  Sign up at [Render.com](https://render.com) using GitHub.
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repository.
4.  Configure the service:
    *   **Name**: `aura-api`
    *   **Root Directory**: `server`
    *   **Environment**: `Node`
    *   **Build Command**: `npm install && npm run build`
    *   **Start Command**: `npm start`
    *   **Instance Type**: `Free`
5.  Add **Environment Variables**:
    *   `MONGODB_URI`: (Your MongoDB connection string from Step 1)
    *   `JWT_SECRET`: (A long random string, e.g., `aura_secure_random_key_2026`)
    *   `PORT`: `10000` (Render's default)
    *   `CLOUDINARY_URL`: (If you use Cloudinary for images)
    *   `STRIPE_SECRET_KEY`: (Your Stripe secret key)
6.  Click **Create Web Service**. 
    *   *Note: Free services spin down after 15 mins of inactivity. The first request after a break might take ~30-60 seconds.*

---

## 4. Step 3: Storefront (Vercel)
Vercel is optimized for React/Vite apps.

1.  Sign up at [Vercel.com](https://vercel.com) using GitHub.
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository.
4.  Configure the project:
    *   **Project Name**: `aura-store`
    *   **Framework Preset**: `Vite`
    *   **Root Directory**: `./` (leave as default)
5.  Add **Environment Variables**:
    *   `VITE_API_URL`: (The URL provided by Render, e.g., `https://aura-api.onrender.com/api`)
6.  Click **Deploy**.

---

## 5. Step 4: Admin Panel (Vercel)
You can deploy the admin panel as a separate project on Vercel.

1.  On Vercel, click **Add New...** -> **Project**.
2.  Import the **same** GitHub repository again.
3.  Configure the project:
    *   **Project Name**: `aura-admin`
    *   **Framework Preset**: `Vite`
    *   **Root Directory**: `admin`
4.  Add **Environment Variables**:
    *   `VITE_API_URL`: (The same Render URL from Step 3)
5.  Click **Deploy**.

---

## 6. Final Configuration Checklist
> [!IMPORTANT]
> Ensure your Stripe and Cloudinary settings are updated to allow requests from your new production domains.

| Service | Environment Variable | Value Example |
| :--- | :--- | :--- |
| **Backend** | `MONGODB_URI` | `mongodb+srv://user:pass@cluster...` |
| **Backend** | `JWT_SECRET` | `your_secret_key` |
| **Frontend** | `VITE_API_URL` | `https://aura-api.onrender.com/api` |
| **Admin** | `VITE_API_URL` | `https://aura-api.onrender.com/api` |

---

## Summary of URL Mapping
*   **API**: `https://aura-api.onrender.com`
*   **Storefront**: `https://aura-store.vercel.app`
*   **Admin Panel**: `https://aura-admin.vercel.app`
