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

export async function adminLogin(username: string, password: string): Promise<AdminAuthUser> {
  const res = await fetch(`${API_BASE}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new Error(data?.error || `Server Error (${res.status}): ${res.statusText}`);
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
  location?: string;
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
  estimatedDelivery?: string;
  cancellationReason?: string;
  trackingHistory: TrackingEvent[];
  isDeleted?: boolean;
  deletedAt?: string;
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
  gender: 'men' | 'women' | 'unisex';
  isDeleted?: boolean;
  deletedAt?: string;
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
export async function fetchOrders(deleted: boolean = false): Promise<Order[]> {
  const res = await fetch(`${API_BASE}/orders?deleted=${deleted}`, {
    headers: { ...authHeaders() },
  });
  if (res.status === 401) { adminLogout(); window.location.reload(); }
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function softDeleteOrder(orderId: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/soft-delete`, {
    method: 'PATCH',
    headers: { ...authHeaders() },
  });
  if (res.status === 401) { adminLogout(); window.location.reload(); }
  if (!res.ok) throw new Error('Failed to delete order');
  const data = await res.json();
  return data.order;
}

export async function restoreOrder(orderId: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/restore`, {
    method: 'PATCH',
    headers: { ...authHeaders() },
  });
  if (res.status === 401) { adminLogout(); window.location.reload(); }
  if (!res.ok) throw new Error('Failed to restore order');
  const data = await res.json();
  return data.order;
}

export async function permanentlyDeleteOrder(orderId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/orders/${orderId}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (res.status === 401) { adminLogout(); window.location.reload(); }
  if (!res.ok) throw new Error('Failed to permanently delete order');
}

export async function deleteOrdersBulk(orderIds: string[]): Promise<void> {
  const res = await fetch(`${API_BASE}/orders/bulk-delete`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ orderIds }),
  });
  if (res.status === 401) { adminLogout(); window.location.reload(); }
  if (!res.ok) throw new Error('Failed to bulk delete orders');
}

export async function softDeleteOrdersBulk(orderIds: string[]): Promise<void> {
  const res = await fetch(`${API_BASE}/orders/bulk-soft-delete`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ orderIds }),
  });
  if (res.status === 401) { adminLogout(); window.location.reload(); }
  if (!res.ok) throw new Error('Failed to bulk soft delete orders');
}

export async function restoreOrdersBulk(orderIds: string[]): Promise<void> {
  const res = await fetch(`${API_BASE}/orders/bulk-restore`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ orderIds }),
  });
  if (res.status === 401) { adminLogout(); window.location.reload(); }
  if (!res.ok) throw new Error('Failed to bulk restore orders');
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, message?: string, location?: string, estimatedDelivery?: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ status, message, location, estimatedDelivery }),
  });
  if (res.status === 401) { adminLogout(); window.location.reload(); }
  if (!res.ok) throw new Error('Failed to update order status');
  return res.json();
}

export async function addTrackingEvent(orderId: string, status: string, message: string, location?: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/tracking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ status, message, location }),
  });
  if (res.status === 401) { adminLogout(); window.location.reload(); }
  if (!res.ok) throw new Error('Failed to add tracking event');
  return res.json();
}

// ── Products ──
export async function fetchProducts(deleted: boolean = false): Promise<AdminProduct[]> {
  const res = await fetch(`${API_BASE}/products?deleted=${deleted}`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function createProduct(product: AdminProduct): Promise<AdminProduct> {
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(product),
  });
  if (res.status === 401) { adminLogout(); window.location.reload(); }
  if (!res.ok) throw new Error('Failed to create product');
  return res.json();
}

export async function updateProduct(id: string, product: AdminProduct): Promise<AdminProduct> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(product),
  });
  if (res.status === 401) { adminLogout(); window.location.reload(); }
  if (!res.ok) throw new Error('Failed to update product');
  return res.json();
}

export async function updateProductStock(id: string, stock: number): Promise<AdminProduct> {
  const res = await fetch(`${API_BASE}/products/${id}/stock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ stock }),
  });
  if (res.status === 401) { adminLogout(); window.location.reload(); }
  if (!res.ok) throw new Error('Failed to update stock');
  return res.json();
}

export async function softDeleteProduct(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/products/${id}/soft-delete`, {
    method: 'PATCH',
    headers: { ...authHeaders() },
  });
  if (res.status === 401) { adminLogout(); window.location.reload(); }
  if (!res.ok) throw new Error('Failed to delete product');
}

export async function restoreProduct(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/products/${id}/restore`, {
    method: 'PATCH',
    headers: { ...authHeaders() },
  });
  if (res.status === 401) { adminLogout(); window.location.reload(); }
  if (!res.ok) throw new Error('Failed to restore product');
}

export async function permanentlyDeleteProduct(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (res.status === 401) { adminLogout(); window.location.reload(); }
  if (!res.ok) throw new Error('Failed to permanently delete product');
}

export async function permanentlyDeleteProductsBulk(ids: string[]): Promise<void> {
  const res = await fetch(`${API_BASE}/products/bulk`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ ids }),
  });
  if (res.status === 401) { adminLogout(); window.location.reload(); }
  if (!res.ok) throw new Error('Failed to delete products');
}

export async function softDeleteProductsBulk(ids: string[]): Promise<void> {
  const res = await fetch(`${API_BASE}/products/bulk-soft-delete`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ ids }),
  });
  if (res.status === 401) { adminLogout(); window.location.reload(); }
  if (!res.ok) throw new Error('Failed to delete products');
}

export async function restoreProductsBulk(ids: string[]): Promise<void> {
  const res = await fetch(`${API_BASE}/products/bulk-restore`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ ids }),
  });
  if (res.status === 401) { adminLogout(); window.location.reload(); }
  if (!res.ok) throw new Error('Failed to restore products');
}

export async function updateProductsStockBulk(ids: string[], stock: number): Promise<void> {
  const res = await fetch(`${API_BASE}/products/bulk-stock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ ids, stock }),
  });
  if (res.status === 401) { adminLogout(); window.location.reload(); }
  if (!res.ok) throw new Error('Failed to update stock');
}

export async function uploadProductImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  
  const res = await fetch(`${API_BASE}/products/upload`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: formData,
  });
  
  if (res.status === 401) { adminLogout(); window.location.reload(); }
  if (!res.ok) throw new Error('Failed to upload image');
  
  const data = await res.json();
  return data.url;
}

export async function fetchAdminNotifications(): Promise<AdminNotificationsResponse> {
  const res = await fetch(`${API_BASE}/admin/notifications`, {
    headers: { ...authHeaders() },
  });
  if (res.status === 401) { adminLogout(); window.location.reload(); }
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

// ── Analytics ──
export async function fetchSalesAnalytics(): Promise<SalesAnalytics> {
  const res = await fetch(`${API_BASE}/analytics/sales`, {
    headers: { ...authHeaders() },
  });
  if (res.status === 401) { adminLogout(); window.location.reload(); }
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

// ── Campaigns ──
export interface Campaign {
  _id: string;
  type: 'restock_alert' | 'flash_sale' | 'birthday_offer' | 'custom';
  message: string;
  audienceCount: number;
  status: 'sent' | 'failed';
  createdAt: string;
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  const res = await fetch(`${API_BASE}/campaigns`, {
    headers: { ...authHeaders() },
  });
  if (res.status === 401) { adminLogout(); window.location.reload(); }
  if (!res.ok) throw new Error('Failed to fetch campaigns');
  return res.json();
}

export async function createCampaign(type: string, message: string): Promise<Campaign> {
  const res = await fetch(`${API_BASE}/campaigns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ type, message }),
  });
  if (res.status === 401) { adminLogout(); window.location.reload(); }
  if (!res.ok) throw new Error('Failed to create campaign');
  return res.json();
}

export async function deleteCampaignsBulk(ids: string[]): Promise<void> {
  const res = await fetch(`${API_BASE}/campaigns/bulk`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ ids }),
  });
  if (res.status === 401) { adminLogout(); window.location.reload(); }
  if (!res.ok) throw new Error('Failed to delete campaigns');
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
