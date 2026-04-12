import type { Product } from '../data';
import { formatPrice } from '../data';
import { useState } from 'react';

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

export default function CartFlyout({ isOpen, onClose, cart, updateQuantity, removeItem, clearCart, onCheckout }: CartFlyoutProps) {
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'success'>('cart');
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    fullName: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
  });
  const [shippingErrors, setShippingErrors] = useState<Partial<ShippingInfo>>({});
  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    setTimeout(() => setCheckoutStep('cart'), 300);
  };

  const handleCheckoutComplete = () => {
    clearCart();
    setCheckoutStep('success');
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

  const handleProceedToPayment = () => {
    if (!validateShipping()) return;
    // Close the flyout and open the full checkout page
    onCheckout(shippingInfo);
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
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={handleClose} />
      <div className="glass-card w-full max-w-md h-full relative z-10 flex flex-col border-l border-white/40 animate-slide-in">
        
        <div className="p-6 border-b border-white/20 flex justify-between items-center backdrop-blur-md bg-white/40">
          <h2 className="text-xl font-bold tracking-tight">
            {checkoutStep === 'cart' ? 'YOUR CART' : checkoutStep === 'success' ? 'ORDER COMPLETE' : 'CHECKOUT'}
          </h2>
          <button onClick={handleClose} className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {checkoutStep === 'success' ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-green-500/20 text-green-600 rounded-full flex items-center justify-center text-4xl mb-4 shadow-[0_0_30px_rgba(34,197,94,0.3)]">✓</div>
              <h3 className="text-2xl font-bold text-gray-800">Order Confirmed!</h3>
              <p className="text-gray-500 mb-2">Thank you for your purchase.</p>
              <div className="glass-panel px-6 py-3 rounded-xl mb-6">
                <span className="text-sm font-medium text-gray-400">Order Number</span>
                <p className="text-lg font-mono font-bold text-gray-800">#AURA-{Math.floor(Math.random() * 1000000)}</p>
              </div>
              <button onClick={handleClose} className="glass-dark mt-4 px-8 py-3 rounded-full text-sm font-bold tracking-wider w-full">CONTINUE SHOPPING</button>
            </div>
          ) : cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <p className="mb-4">Your cart is empty.</p>
              <button onClick={handleClose} className="glass-panel px-6 py-2 rounded-full text-sm font-bold text-gray-800">BROWSE PRODUCTS</button>
            </div>
          ) : checkoutStep === 'cart' ? (
            <div className="space-y-6">
              {cart.map((item, idx) => (
                <div key={idx} className="flex gap-4 glass-panel p-3 rounded-2xl relative group">
                  <div className="w-20 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    <img src={item.product.images[0]} className="w-full h-full object-cover" alt={item.product.name} loading="lazy" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between">
                        <h4 className="font-semibold text-sm text-gray-800 line-clamp-1 pr-6">{item.product.name}</h4>
                        <button 
                          onClick={() => removeItem(item.product.id, item.selectedSize, item.selectedColor)}
                          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors text-xs"
                        >✕</button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 capitalize">{item.selectedColor} | Size: {item.selectedSize}</p>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm font-medium">{formatPrice(item.product.price)}</span>
                      <div className="flex items-center gap-3 bg-white/50 px-2 py-1 rounded-lg border border-white/40">
                        <button onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity - 1)} className="w-5 h-5 flex items-center justify-center font-bold text-gray-600 hover:text-black">-</button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity + 1)} className="w-5 h-5 flex items-center justify-center font-bold text-gray-600 hover:text-black">+</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : checkoutStep === 'shipping' ? (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-bold text-gray-800 mb-4">Shipping Details</h3>
              <div>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={shippingInfo.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  className={`w-full glass-panel px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/20 focus:bg-white/90 transition-all ${shippingErrors.fullName ? 'ring-2 ring-red-400' : ''}`}
                />
                {shippingErrors.fullName && <p className="text-red-500 text-xs mt-1 ml-2">{shippingErrors.fullName}</p>}
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={shippingInfo.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className={`w-full glass-panel px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/20 focus:bg-white/90 transition-all ${shippingErrors.email ? 'ring-2 ring-red-400' : ''}`}
                />
                {shippingErrors.email && <p className="text-red-500 text-xs mt-1 ml-2">{shippingErrors.email}</p>}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Address line 1"
                  value={shippingInfo.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className={`w-full glass-panel px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/20 focus:bg-white/90 transition-all ${shippingErrors.address ? 'ring-2 ring-red-400' : ''}`}
                />
                {shippingErrors.address && <p className="text-red-500 text-xs mt-1 ml-2">{shippingErrors.address}</p>}
              </div>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <input
                    type="text"
                    placeholder="City"
                    value={shippingInfo.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className={`w-full glass-panel px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/20 focus:bg-white/90 transition-all ${shippingErrors.city ? 'ring-2 ring-red-400' : ''}`}
                  />
                  {shippingErrors.city && <p className="text-red-500 text-xs mt-1 ml-2">{shippingErrors.city}</p>}
                </div>
                <div className="w-1/2">
                  <input
                    type="text"
                    placeholder="Postal Code"
                    value={shippingInfo.postalCode}
                    onChange={(e) => updateField('postalCode', e.target.value)}
                    className={`w-full glass-panel px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/20 focus:bg-white/90 transition-all ${shippingErrors.postalCode ? 'ring-2 ring-red-400' : ''}`}
                  />
                  {shippingErrors.postalCode && <p className="text-red-500 text-xs mt-1 ml-2">{shippingErrors.postalCode}</p>}
                </div>
              </div>

              {/* Stripe badge */}
              <div className="flex items-center justify-center gap-2 pt-4">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-gray-400">You'll pay securely via <span className="font-semibold text-[#635BFF]">Stripe</span> on the next step</span>
              </div>
            </div>
          ) : null}
        </div>

        {cart.length > 0 && checkoutStep !== 'success' && (
          <div className="p-6 bg-white/40 backdrop-blur-md border-t border-white/20">
            <div className="flex justify-between mb-2 text-gray-600 text-sm">
              <span>Subtotal</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            <div className="flex justify-between mb-4 text-sm text-gray-500">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between mb-6 text-gray-900 font-bold text-lg">
              <span>Total</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            <button 
              onClick={() => {
                if (checkoutStep === 'cart') setCheckoutStep('shipping');
                else if (checkoutStep === 'shipping') handleProceedToPayment();
              }}
              className="w-full glass-dark py-4 rounded-full text-sm font-bold tracking-widest hover:bg-black/90 hover:scale-[1.02] transition-all flex justify-center items-center gap-2 px-8 shadow-xl"
            >
              {checkoutStep === 'cart' ? (
                <span>PROCEED TO CHECKOUT</span>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>CONTINUE TO PAYMENT</span>
                </>
              )}
            </button>
            {checkoutStep !== 'cart' && (
              <button 
                onClick={() => {
                  if (checkoutStep === 'shipping') setCheckoutStep('cart');
                }}
                className="w-full mt-3 py-2 text-xs font-bold text-gray-500 hover:text-black tracking-widest"
              >
                BACK
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
