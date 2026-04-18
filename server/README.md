# 🖥️ AURA API Server

The backend foundation for the AURA Clothing ecosystem. A RESTful API built with **Express 5** and **TypeScript**, connected to **MongoDB**.

## 🛠️ Tech Stack
- **Express 5**: Web framework.
- **Mongoose**: ODM for MongoDB.
- **jsonwebtoken & bcryptjs**: Secure authentication logic.
- **Stripe**: Payment processing integration.
- **tsx**: Modern TypeScript execution.

## 📁 Key Directories
- `/src/models`: Data structures for Products and Orders.
- `/src/routes`: API endpoint logic categorized by resource.
- `/src/db.ts`: Connection handler for MongoDB.

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Environment Variables
Create a `.env` file with:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_webhook_signing_secret
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
```

### Scripts
- `npm run dev`: Start development server with hot-reload.
- `npm run seed`: Populate the database with sample products.
- `npm run build`: Compile TypeScript to JavaScript.
- `npm run start`: Run the production server.

## 🔌 Core Endpoints
- `GET /api/products`: Fetch products.
- `POST /api/orders`: Submit a new order.
- `GET /api/orders`: Retrieve all orders (Admin).
- `PATCH /api/orders/:id/status`: Update order fulfillment status.
