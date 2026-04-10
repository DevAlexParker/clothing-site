import { useState } from 'react';
import './index.css';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
}

const products: Product[] = [
  {
    id: '1',
    name: 'Minimalist Overcoat',
    price: 299,
    category: 'Outerwear',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '2',
    name: 'Silk Crepe Dress',
    price: 185,
    category: 'Dresses',
    image: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '3',
    name: 'Structured Blazer',
    price: 245,
    category: 'Tailoring',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '4',
    name: 'Essential Cotton Tee',
    price: 45,
    category: 'Basics',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '5',
    name: 'Tailored Wool Trousers',
    price: 160,
    category: 'Bottoms',
    image: 'https://images.unsplash.com/photo-1434389678369-182cb20dcb86?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '6',
    name: 'Leather Crossbody',
    price: 210,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&q=80&w=800'
  }
];

export default function App() {
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'success'>('cart');

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
    setCheckoutStep('cart');
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.product.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);


  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef]">
      
      {/* Abstract Background Orbs for Glassmorphism Context */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/50 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-200/40 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 px-8 py-5">
        <div className="glass-panel max-w-7xl mx-auto rounded-full flex justify-between items-center px-8 py-3">
          <h1 className="text-2xl font-bold tracking-tighter text-primary">AURA.</h1>
          <nav className="hidden md:flex gap-8 text-sm font-medium tracking-wide">
            <a href="#" className="hover:text-accent transition-colors">COLLECTIONS</a>
            <a href="#" className="hover:text-accent transition-colors">NEW ARRIVALS</a>
            <a href="#" className="hover:text-accent transition-colors">ABOUT</a>
          </nav>
          <button 
            className="flex items-center gap-2 hover:opacity-70 transition-opacity relative"
            onClick={() => setIsCartOpen(true)}
          >
            <span className="text-sm font-medium">CART</span>
            <div className="bg-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </div>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-8 max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
        <h2 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500 mb-6 drop-shadow-sm">
          Simplicity is <br/> the ultimate sophistication.
        </h2>
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mb-12 font-light">
          Discover our new Spring/Summer collection. Elevate your everyday with premium materials and timeless silhouettes.
        </p>
        <button className="glass-dark px-10 py-4 rounded-full text-sm font-semibold tracking-widest hover:scale-105 hover:bg-black/80 transition-all duration-300">
          EXPLORE NOW
        </button>
      </section>

      {/* Product Grid */}
      <section className="px-8 pb-32 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 perspective-1000">
          {products.map((product) => (
            <div 
              key={product.id}
              className="group cursor-pointer perspective-1000"
            >
              <div 
                className="glass-card rounded-3xl p-6 h-full flex flex-col relative overflow-hidden transition-all duration-500 ease-out transform-style-3d group-hover:[transform:rotateX(5deg)_rotateY(-10deg)_translateZ(20px)] shadow-[0_4px_20px_rgba(0,0,0,0.1)] group-hover:shadow-[20px_20px_40px_rgba(0,0,0,0.2)]"
              >
                {/* Subtle shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none transform -translate-x-full group-hover:translate-x-full duration-1000"></div>

                <div className="relative h-80 rounded-2xl overflow-hidden mb-6 bg-gray-100 transition-transform duration-500 ease-out transform-style-3d group-hover:[transform:translateZ(40px)]">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute top-4 left-4 glass-panel px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
                    {product.category}
                  </div>
                </div>
                
                <div className="mt-auto transition-transform duration-500 ease-out transform-style-3d group-hover:[transform:translateZ(30px)]">
                  <h3 className="text-xl font-semibold mb-1 text-gray-800">{product.name}</h3>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-lg font-light text-gray-600">${product.price}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="glass-panel px-6 py-2 rounded-full text-sm font-medium hover:bg-black hover:text-white transition-colors duration-300 shadow-sm hover:shadow-md"
                    >
                      ADD
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cart / Checkout Overlay */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="glass-card w-full max-w-md h-full relative z-10 flex flex-col border-l border-white/40 animate-slide-in">
            
            <div className="p-6 border-b border-white/20 flex justify-between items-center backdrop-blur-md bg-white/40">
              <h2 className="text-xl font-bold tracking-tight">
                {checkoutStep === 'cart' ? 'YOUR CART' : checkoutStep === 'checkout' ? 'CHECKOUT' : 'SUCCESS'}
              </h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
                aria-label="Close cart"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {checkoutStep === 'success' ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-green-500/20 text-green-600 rounded-full flex items-center justify-center text-4xl mb-4 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                    ✓
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Order Confirmed!</h3>
                  <p className="text-gray-500">Thank you for your purchase.</p>
                  <button 
                    onClick={() => {
                      setCart([]);
                      setIsCartOpen(false);
                      setTimeout(() => setCheckoutStep('cart'), 300);
                    }}
                    className="glass-dark mt-8 px-8 py-3 rounded-full text-sm font-bold tracking-wider w-full"
                  >
                    CONTINUE SHOPPING
                  </button>
                </div>
              ) : cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <p className="mb-4">Your cart is empty.</p>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="glass-panel px-6 py-2 rounded-full text-sm font-bold text-gray-800"
                  >
                    BROWSE PRODUCTS
                  </button>
                </div>
              ) : checkoutStep === 'cart' ? (
                <div className="space-y-6">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex gap-4 glass-panel p-3 rounded-2xl">
                      <div className="w-20 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        <img src={item.product.image} className="w-full h-full object-cover" alt={item.product.name} />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex justify-between">
                            <h4 className="font-semibold text-sm text-gray-800 line-clamp-1">{item.product.name}</h4>
                            <button 
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors text-xs"
                            >
                              ✕
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{item.product.category}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-light">${item.product.price}</span>
                          <span className="text-xs font-bold glass-panel px-2 py-1 rounded-md">Qty: {item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="font-bold text-gray-800 mb-4">Shipping Details</h3>
                  <input type="text" placeholder="Full Name" className="w-full glass-panel px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/20 focus:bg-white/90 transition-all" />
                  <input type="email" placeholder="Email Address" className="w-full glass-panel px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/20 focus:bg-white/90 transition-all" />
                  <input type="text" placeholder="Address" className="w-full glass-panel px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/20 focus:bg-white/90 transition-all" />
                  
                  <h3 className="font-bold text-gray-800 mt-8 mb-4">Payment</h3>
                  <div className="glass-panel p-4 rounded-xl space-y-4">
                    <input type="text" placeholder="Card Number" className="w-full bg-white/50 px-4 py-2 rounded-lg text-sm border border-white/40 outline-none" />
                    <div className="flex gap-4">
                      <input type="text" placeholder="MM/YY" className="w-1/2 bg-white/50 px-4 py-2 rounded-lg text-sm border border-white/40 outline-none" />
                      <input type="text" placeholder="CVC" className="w-1/2 bg-white/50 px-4 py-2 rounded-lg text-sm border border-white/40 outline-none" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {cart.length > 0 && checkoutStep !== 'success' && (
              <div className="p-6 bg-white/40 backdrop-blur-md border-t border-white/20">
                <div className="flex justify-between mb-4 text-gray-800">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-bold">${cartTotal}</span>
                </div>
                <div className="flex justify-between mb-6 text-sm text-gray-500">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <button 
                  onClick={() => {
                    if (checkoutStep === 'cart') setCheckoutStep('checkout');
                    else setCheckoutStep('success');
                  }}
                  className="w-full glass-dark py-4 rounded-full text-sm font-bold tracking-widest hover:bg-black/90 hover:scale-[1.02] transition-all flex justify-between px-8"
                >
                  <span>{checkoutStep === 'cart' ? 'CHECKOUT' : 'PAY NOW'}</span>
                  <span>${cartTotal}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global styles for animations not covered by tailwind utilities natively */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
