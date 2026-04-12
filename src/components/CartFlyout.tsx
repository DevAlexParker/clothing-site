// ✅ MERGED & CLEAN VERSION (NO CONFLICTS)

import type { Product } from '../data';
import { formatPrice } from '../data';
import { useState } from 'react';
import { createOrder } from '../lib/api';

interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

export interface ShippingInfo {
  fullName: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
}

interface CartFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  updateQuantity: (id: string, size: string, color: string, qty: number) => void;
  removeItem: (id: string, size: string, color: string) => void;
  clearCart: () => void;
  onCheckout: (shippingInfo: ShippingInfo) => void;
}

export default function CartFlyout({
  isOpen,
  onClose,
  cart,
  updateQuantity,
  removeItem,
  clearCart,
  onCheckout
}: CartFlyoutProps) {

  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'payment' | 'success'>('cart');

  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    fullName: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
  });

  const [shippingErrors, setShippingErrors] = useState<Partial<ShippingInfo>>({});
  const [orderId, setOrderId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    setTimeout(() => setCheckoutStep('cart'), 300);
  };

  const validateShipping = (): boolean => {
    const errors: Partial<ShippingInfo> = {};
    if (!shippingInfo.fullName.trim()) errors.fullName = 'Required';
    if (!shippingInfo.email.trim()) errors.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(shippingInfo.email)) errors.email = 'Invalid email';
    if (!shippingInfo.address.trim()) errors.address = 'Required';
    if (!shippingInfo.city.trim()) errors.city = 'Required';
    if (!shippingInfo.postalCode.trim()) errors.postalCode = 'Required';

    setShippingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCheckoutComplete = async () => {
    setIsSubmitting(true);
    const newOrderId = `AURA-${Math.floor(Math.random() * 1000000)}`;

    try {
      await createOrder({
        orderId: newOrderId,
        customerInfo: shippingInfo,
        items: cart.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          productImage: item.product.images[0],
          productPrice: item.product.price,
          quantity: item.quantity,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
        })),
        totalAmount: cartTotal,
      });

      setOrderId(newOrderId);
      clearCart();
      setCheckoutStep('success');
    } catch (error) {
      console.error('Failed to place order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof ShippingInfo, value: string) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }));
    if (shippingErrors[field]) {
      setShippingErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={handleClose} />

      <div className="w-full max-w-md h-full bg-white flex flex-col">

        {/* HEADER */}
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="font-bold">
            {checkoutStep === 'cart'
              ? 'YOUR CART'
              : checkoutStep === 'success'
              ? 'ORDER COMPLETE'
              : 'CHECKOUT'}
          </h2>
          <button onClick={handleClose}>✕</button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-4">

          {checkoutStep === 'success' ? (
            <div className="text-center">
              <h3>Order Confirmed!</h3>
              <p>Order ID: {orderId}</p>
              <button onClick={handleClose}>Continue</button>
            </div>

          ) : checkoutStep === 'shipping' ? (
            <div className="space-y-3">

              <input placeholder="Full Name"
                value={shippingInfo.fullName}
                onChange={e => updateField('fullName', e.target.value)} />

              <input placeholder="Email"
                value={shippingInfo.email}
                onChange={e => updateField('email', e.target.value)} />

              <input placeholder="Address"
                value={shippingInfo.address}
                onChange={e => updateField('address', e.target.value)} />

              <input placeholder="City"
                value={shippingInfo.city}
                onChange={e => updateField('city', e.target.value)} />

              <input placeholder="Postal Code"
                value={shippingInfo.postalCode}
                onChange={e => updateField('postalCode', e.target.value)} />

            </div>

          ) : checkoutStep === 'payment' ? (
            <div>
              <h3>Payment Step</h3>
              <p>Stripe integration comes here</p>
            </div>

          ) : (
            <div>
              {cart.map((item, i) => (
                <div key={i}>
                  <p>{item.product.name}</p>
                  <p>{formatPrice(item.product.price)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        {cart.length > 0 && checkoutStep !== 'success' && (
          <div className="p-4 border-t">

            <p>Total: {formatPrice(cartTotal)}</p>

            <button
              onClick={() => {
                if (checkoutStep === 'cart') setCheckoutStep('shipping');
                else if (checkoutStep === 'shipping') {
                  if (!validateShipping()) return;
                  setCheckoutStep('payment');
                }
                else if (checkoutStep === 'payment') {
                  handleCheckoutComplete();
                }
              }}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'PLACING ORDER...'
                : checkoutStep === 'cart'
                ? 'Checkout'
                : checkoutStep === 'shipping'
                ? 'Continue'
                : 'Pay Now'}
            </button>

          </div>
        )}
      </div>
    </div>
  );
}