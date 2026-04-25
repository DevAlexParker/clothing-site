// Re-export types from the API helper for backward compatibility
export type { Product, OrderItem, Order } from './lib/api';
export { resolveImageUrl } from './lib/api';

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price).replace('LKR', 'Rs.');
};
