import { useState, useEffect } from 'react';
import type { Product } from './data';
import Navbar from './components/Navbar';
import CartFlyout from './components/CartFlyout';
import type { ShippingInfo } from './components/CartFlyout';
import PDPModal from './components/PDPModal';
import CheckoutPage from './components/CheckoutPage';
import AuthModals from './components/AuthModals';
import Home from './pages/Home';
import Collections from './pages/Collections';
import About from './pages/About';
import Account from './pages/Account';
import ResetPassword from './pages/ResetPassword';
import GDPRBanner from './components/GDPRBanner';



interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [resetPasswordToken, setResetPasswordToken] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);
  const [authModal, setAuthModal] = useState<{isOpen: boolean, type: 'login' | 'signup'}>({
    isOpen: false,
    type: 'login'
  });

  const navigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('resetPasswordToken');
    if (t) {
      setResetPasswordToken(t);
      setCurrentPage('reset-password');
      window.history.replaceState({}, '', window.location.pathname || '/');
    }
  }, []);

  const handleAddToCart = (product: Product, size: string, color: string) => {
    // Defensive: Normalize the product ID (could be .id or ._id depending on origin)
    const pid = product.id || (product as any)._id || (product as any).productId;
    console.log("🛒 Adding to Cart:", { pid, name: product.name, size, color });
    
    if (!pid) {
      console.error("❌ Add to Cart failed: No product ID found", product);
      return;
    }

    setCart(prev => {
      // Find if item already exists in cart with same size/color
      const existingIdx = prev.findIndex(item => 
        (item.product.id === pid || (item.product as any)._id === pid) && 
        item.selectedSize === size && 
        item.selectedColor === color
      );

      if (existingIdx !== -1) {
        // Increment quantity
        const nextCart = [...prev];
        nextCart[existingIdx] = {
          ...nextCart[existingIdx],
          quantity: nextCart[existingIdx].quantity + 1
        };
        return nextCart;
      }

      // Add as new item
      return [...prev, { 
        product: { ...product, id: pid }, 
        quantity: 1, 
        selectedSize: size, 
        selectedColor: color 
      }];
    });

    setSelectedProduct(null);
    setIsCartOpen(true);
    
    // Safety Force: Scroll to top of cart list if it's too long
    setTimeout(() => {
      const cartContainer = document.querySelector('.overflow-y-auto');
      if (cartContainer) cartContainer.scrollTop = 0;
    }, 100);
  };

  const updateQuantity = (id: string, size: string, color: string, qty: number) => {
    if (qty < 1) {
      removeItem(id, size, color);
      return;
    }
    setCart(prev => prev.map(item => 
      ((item.product.id || (item.product as any)._id) === id && item.selectedSize === size && item.selectedColor === color)
        ? { ...item, quantity: qty }
        : item
    ));
  };

  const removeItem = (id: string, size: string, color: string) => {
    setCart(prev => prev.filter(item => 
      !(item.product.id === id && item.selectedSize === size && item.selectedColor === color)
    ));
  };

  const handleCheckout = (shipping: ShippingInfo) => {
    setShippingInfo(shipping);
    setIsCartOpen(false);
    setCurrentPage('checkout');
    window.scrollTo(0, 0);
  };

  const handlePaymentSuccess = () => {
    setCart([]);
    setShippingInfo(null);
    setCurrentPage('home');
    window.scrollTo(0, 0);
  };

  const handleCheckoutBack = () => {
    setCurrentPage('home');
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef]">
      
      {/* Background Ambience */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/50 blur-[120px] pointer-events-none transition-all duration-1000" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-200/40 blur-[150px] pointer-events-none transition-all duration-1000" />

      <Navbar 
        cartItemCount={cart.reduce((sum, item) => sum + item.quantity, 0)} 
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={(type) => setAuthModal({ isOpen: true, type })}
        currentPage={currentPage}
        navigate={navigate}
      />

      <main className="min-h-screen flex flex-col">
        {currentPage === 'home' && <Home onProductClick={setSelectedProduct} navigate={navigate} />}
        {currentPage === 'collections' && <Collections onProductClick={setSelectedProduct} initialFilter="all" />}
        {currentPage === 'new-arrivals' && <Collections key="new-arrivals" onProductClick={setSelectedProduct} initialFilter="new-arrivals" />}
        {currentPage === 'about' && <About />}
        {currentPage === 'account' && <Account />}
        {currentPage === 'reset-password' && resetPasswordToken && (
          <ResetPassword
            token={resetPasswordToken}
            onDone={() => {
              setResetPasswordToken(null);
              navigate('home');
            }}
          />
        )}


        {currentPage === 'checkout' && shippingInfo && (
          <CheckoutPage
            cart={cart}
            shippingInfo={shippingInfo}
            onPaymentSuccess={handlePaymentSuccess}
            onBack={handleCheckoutBack}
          />
        )}
      </main>

      {/* Auth Modals */}
      <AuthModals 
        isOpen={authModal.isOpen} 
        initialType={authModal.type} 
        onClose={() => setAuthModal({ ...authModal, isOpen: false })} 
      />

      {currentPage !== 'checkout' && (
        <footer className="w-full border-t border-gray-200/50 pt-20 pb-8 relative z-10 bg-white/40 backdrop-blur-md mt-auto">
          <div className="max-w-7xl mx-auto px-8 mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
              {/* Column 1: Brand Information */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-black tracking-tighter text-black mb-4">AURA.</h3>
                  <p className="text-sm text-gray-500 font-light leading-relaxed max-w-xs">
                    Meticulously crafted, timeless pieces that form the foundation of a modern wardrobe. Redefining staples for the contemporary minimalist.
                  </p>
                </div>
                <div className="flex gap-3">
                  <a href="#" className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-black hover:text-white hover:border-black transition-all duration-300 shadow-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100-2.881 1.44 1.44 0 000 2.881z"/></svg>
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-black hover:text-white hover:border-black transition-all duration-300 shadow-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-black hover:text-white hover:border-black transition-all duration-300 shadow-sm font-bold text-sm">
                    X
                  </a>
                </div>
              </div>

              {/* Column 2: Shopping Links */}
              <div>
                <h4 className="text-xs font-black tracking-[0.2em] uppercase mb-6 text-black">Shop</h4>
                <ul className="space-y-4">
                  <li><button onClick={() => navigate('collections')} className="text-sm text-gray-500 hover:text-black hover:translate-x-1 transition-all duration-300 flex items-center gap-2">Collections</button></li>
                  <li><button onClick={() => navigate('new-arrivals')} className="text-sm text-gray-500 hover:text-black hover:translate-x-1 transition-all duration-300 flex items-center gap-2">New Arrivals</button></li>
                  <li><button onClick={() => navigate('collections')} className="text-sm text-gray-500 hover:text-black hover:translate-x-1 transition-all duration-300 flex items-center gap-2">Best Sellers</button></li>
                  <li><button onClick={() => navigate('collections')} className="text-sm text-gray-500 hover:text-black hover:translate-x-1 transition-all duration-300 flex items-center gap-2">Accessories</button></li>
                </ul>
              </div>

              {/* Column 3: Company Details */}
              <div>
                <h4 className="text-xs font-black tracking-[0.2em] uppercase mb-6 text-black">Company</h4>
                <ul className="space-y-4">
                  <li><button onClick={() => navigate('about')} className="text-sm text-gray-500 hover:text-black hover:translate-x-1 transition-all duration-300 flex items-center gap-2">Our Story</button></li>
                  <li><button onClick={() => navigate('about')} className="text-sm text-gray-500 hover:text-black hover:translate-x-1 transition-all duration-300 flex items-center gap-2">Sustainability</button></li>
                  <li><button onClick={() => navigate('about')} className="text-sm text-gray-500 hover:text-black hover:translate-x-1 transition-all duration-300 flex items-center gap-2">Careers</button></li>
                  <li><button className="text-sm text-gray-500 hover:text-black hover:translate-x-1 transition-all duration-300 flex items-center gap-2">Terms & Privacy</button></li>
                </ul>
              </div>

              {/* Column 4: Contact Information */}
              <div>
                <h4 className="text-xs font-black tracking-[0.2em] uppercase mb-6 text-black">Support</h4>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <span className="text-sm text-gray-500 leading-relaxed">
                      No. 42, Galle Road, Colombo 03, Sri Lanka
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    <a href="mailto:hello@auraclothing.lk" className="text-sm text-gray-500 hover:text-black transition-colors">hello@auraclothing.lk</a>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                    <a href="tel:+94112345678" className="text-sm text-gray-500 hover:text-black transition-colors">+94 11 234 5678</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-200/50 pt-8">
            <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase text-center md:text-left">
                © 2026 AURA Clothing. All Rights Reserved.
                <span className="block md:inline md:ml-4 mt-2 md:mt-0 font-light normal-case tracking-normal">
                  Crafted by{' '}
                  <a href="https://sofycode.com" target="_blank" rel="noopener noreferrer" className="font-black text-gray-900 hover:opacity-70 transition-opacity">SofyCode</a>
                </span>
              </div>
              <div className="flex gap-8">
                <a href="#" className="text-[10px] font-bold tracking-[0.2em] text-gray-400 hover:text-black transition-colors uppercase">Privacy</a>
                <a href="#" className="text-[10px] font-bold tracking-[0.2em] text-gray-400 hover:text-black transition-colors uppercase">Terms</a>
                <a href="#" className="text-[10px] font-bold tracking-[0.2em] text-gray-400 hover:text-black transition-colors uppercase">Cookies</a>
              </div>
            </div>
          </div>
        </footer>
      )}

      <CartFlyout 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cart={cart}
        updateQuantity={updateQuantity}
        removeItem={removeItem}
        clearCart={() => setCart([])}
        onCheckout={handleCheckout}
        onRequireLogin={() => setAuthModal({ isOpen: true, type: 'login' })}
      />

      {selectedProduct && (
        <PDPModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onAddToCart={handleAddToCart}
        />
      )}

      {/* WhatsApp FAB */}
      <a 
        href="https://wa.me/94771234567" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-[0_8px_30px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform animate-bounce hover:animate-none flex items-center justify-center cursor-pointer"
        aria-label="Chat on WhatsApp"
      >
        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
        </svg>
      </a>
      <GDPRBanner />
    </div>
  );
}
