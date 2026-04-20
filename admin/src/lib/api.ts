const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'aura_token';
const getAdminToken = () => localStorage.getItem(TOKEN_KEY);
const authHeaders = (): Record<string, string> => {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface AdminAuthUser {
  name: string;
  role: 'admin';
}

export async function adminLogin(username: string, password: string): Promise<AdminAuthUser | { requires2FA: true, userId: string }> {
  const res = await fetch(`${API_BASE}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to login');
  }

  if (data.requires2FA) {
    return { requires2FA: true, userId: data.userId };
  }

  localStorage.setItem(TOKEN_KEY, data.token);
  return data.user as AdminAuthUser;
}

export async function adminLogin2FA(userId: string, otp: string): Promise<AdminAuthUser> {
  const res = await fetch(`${API_BASE}/auth/login/2fa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, otp }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to verify 2FA');
  }

  localStorage.setItem(TOKEN_KEY, data.token);
  return data.user as AdminAuthUser;
}

export function adminLogout() {
  localStorage.removeItem(TOKEN_KEY);
}

export function hasAdminToken() {
  return Boolean(getAdminToken());
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

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface TrackingEvent {
  status: string;
  message: string;
  timestamp: string;
}

export interface Order {
  id: string;
  orderId: string;
  createdAt: string;
  status: OrderStatus;
  paymentMethod: 'stripe' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed';
  customerInfo: {
    fullName: string;
    email: string;
    addressLine1: string;
    city: string;
    postalCode: string;
  };
  items: OrderItem[];
  totalAmount: number;
  trackingHistory: TrackingEvent[];
}

export interface AdminProduct {
  id?: string;
  name: string;
  price: number;
  category: string;
  images: string[];
  colors: { name: string; hex: string }[];
  sizes: string[];
  stock: number;
  isNewArrival?: boolean;
}

export type AdminNotificationType = 'low_stock' | 'out_of_stock' | 'new_order';

export interface AdminNotificationItem {
  id: string;
  type: AdminNotificationType;
  title: string;
  message: string;
  createdAt: string;
}

export interface AdminNotificationsResponse {
  items: AdminNotificationItem[];
}

// ── Sales Analytics Types ──
export interface SalesMonthly {
  month: string;
  monthIndex: number;
  revenue: number;
  orderCount: number;
  itemsSold: number;
  avgOrderValue: number;
}

export interface SalesDailyPoint {
  day: number;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  id: string;
  name: string;
  revenue: number;
  unitsSold: number;
  image: string;
}

export interface SalesAnalytics {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalItemsSold: number;
    avgOrderValue: number;
    growthPercent: number;
  };
  monthly: SalesMonthly[];
  dailySales: SalesDailyPoint[];
  topProducts: TopProduct[];
}

// ── Orders ──
export async function fetchOrders(): Promise<Order[]> {
  const res = await fetch(`${API_BASE}/orders`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, message?: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ status, message }),
  });
  if (!res.ok) throw new Error('Failed to update order status');
  return res.json();
}

export async function addTrackingEvent(orderId: string, status: string, message: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/tracking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ status, message }),
  });
  if (!res.ok) throw new Error('Failed to add tracking event');
  return res.json();
}

// ── Products ──
export async function fetchProducts(): Promise<AdminProduct[]> {
  const res = await fetch(`${API_BASE}/products`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function createProduct(product: AdminProduct): Promise<AdminProduct> {
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(product),
  });
  if (!res.ok) throw new Error('Failed to create product');
  return res.json();
}

export async function updateProduct(id: string, product: AdminProduct): Promise<AdminProduct> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(product),
  });
  if (!res.ok) throw new Error('Failed to update product');
  return res.json();
}

export async function updateProductStock(id: string, stock: number): Promise<AdminProduct> {
  const res = await fetch(`${API_BASE}/products/${id}/stock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ stock }),
  });
  if (!res.ok) throw new Error('Failed to update stock');
  return res.json();
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to delete product');
}

export async function fetchAdminNotifications(): Promise<AdminNotificationsResponse> {
  const res = await fetch(`${API_BASE}/admin/notifications`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

// ── Analytics ──
export async function fetchSalesAnalytics(): Promise<SalesAnalytics> {
  const res = await fetch(`${API_BASE}/analytics/sales`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

// ── Helpers ──
export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price).replace('LKR', 'Rs.');
};
