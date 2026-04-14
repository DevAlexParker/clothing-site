export interface Message {
  role: 'user' | 'stylist';
  content: string;
}

export interface StylistIntent {
  occasion: string;
  budget: number | null;
  style: string;
  fit: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  images: string[];
  colors: { name: string; hex: string }[];
  sizes: string[];
  isNew?: boolean;
  isNewArrival?: boolean;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  productPrice: number;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

export interface Order {
  id: string;
  orderId: string;
  createdAt: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  customerInfo: {
    fullName: string;
    email: string;
    addressLine1: string;
    city: string;
    postalCode: string;
  };
  items: OrderItem[];
  totalAmount: number;
}

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/products`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function fetchProduct(id: string): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/${id}`);
  if (!res.ok) throw new Error('Failed to fetch product');
  return res.json();
}

export interface CreateOrderPayload {
  orderId: string;
  customerInfo: {
    fullName: string;
    email: string;
    addressLine1: string;
    city: string;
    postalCode: string;
  };
  items: OrderItem[];
  totalAmount: number;
}

export async function createOrder(order: CreateOrderPayload): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });
  if (!res.ok) throw new Error('Failed to create order');
  return res.json();
}
