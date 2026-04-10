import type { Product } from '../data';
import { formatPrice } from '../data';
import { useState } from 'react';

interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

interface CartFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  updateQuantity: (id: string, size: string, color: string, qty: number) => void;
  removeItem: (id: string, size: string, color: string) => void;
  clearCart: () => void;
}

export default function CartFlyout({ isOpen, onClose, cart, updateQuantity, removeItem, clearCart }: CartFlyoutProps) {
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'payment' | 'success'>('cart');
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
              <input type="text" placeholder="Full Name" className="w-full glass-panel px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/20 focus:bg-white/90 transition-all" />
              <input type="email" placeholder="Email Address" className="w-full glass-panel px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/20 focus:bg-white/90 transition-all" />
              <input type="text" placeholder="Address line 1" className="w-full glass-panel px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/20 focus:bg-white/90 transition-all" />
              <div className="flex gap-4">
                <input type="text" placeholder="City" className="w-1/2 glass-panel px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/20 focus:bg-white/90 transition-all" />
                <input type="text" placeholder="Postal Code" className="w-1/2 glass-panel px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/20 focus:bg-white/90 transition-all" />
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-bold text-gray-800 mb-4">Payment Info</h3>
              <div className="glass-panel p-5 rounded-2xl space-y-5 bg-gradient-to-br from-white/60 to-white/30 border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.1)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-black/5 to-transparent pointer-events-none" />
                <div className="flex justify-between items-center mb-2">
                  <div className="w-10 h-6 bg-gray-200/50 rounded flex items-center justify-center border border-white/50">
                    <span className="text-[10px] font-bold text-gray-500">VISA</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-6 h-6 rounded-full bg-red-400/80 mix-blend-multiply"></div>
                    <div className="w-6 h-6 rounded-full bg-yellow-400/80 mix-blend-multiply -ml-3"></div>
                  </div>
                </div>
                <input type="text" placeholder="Card Number 0000 0000 0000 0000" className="w-full bg-transparent px-2 py-1 text-lg font-mono tracking-widest placeholder-gray-400/70 border-b border-gray-300/30 outline-none focus:border-black/30" />
                <div className="flex gap-4 mt-4">
                  <div className="w-1/2">
                    <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1 block pl-2">Expiry</span>
                    <input type="text" placeholder="MM/YY" className="w-full bg-transparent px-2 py-1 text-sm font-mono placeholder-gray-400/70 border-b border-gray-300/30 outline-none focus:border-black/30" />
                  </div>
                  <div className="w-1/2">
                    <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1 block pl-2">CVC</span>
                    <input type="text" placeholder="***" className="w-full bg-transparent px-2 py-1 text-sm font-mono placeholder-gray-400/70 border-b border-gray-300/30 outline-none focus:border-black/30" />
                  </div>
                </div>
              </div>
            </div>
          )}
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
                else if (checkoutStep === 'shipping') setCheckoutStep('payment');
                else handleCheckoutComplete();
              }}
              className="w-full glass-dark py-4 rounded-full text-sm font-bold tracking-widest hover:bg-black/90 hover:scale-[1.02] transition-all flex justify-center px-8 shadow-xl"
            >
              <span>
                {checkoutStep === 'cart' ? 'PROCEED TO CHECKOUT' : checkoutStep === 'shipping' ? 'CONTINUE TO PAYMENT' : `PAY ${formatPrice(cartTotal)}`}
              </span>
            </button>
            {checkoutStep !== 'cart' && (
              <button 
                onClick={() => {
                  if (checkoutStep === 'shipping') setCheckoutStep('cart');
                  if (checkoutStep === 'payment') setCheckoutStep('shipping');
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
