import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  cartItemCount: number;
  onOpenCart: () => void;
  onOpenAuth: (type: 'login' | 'signup') => void;
  currentPage: string;
  navigate: (page: string) => void;
}

export default function Navbar({ 
  cartItemCount, 
  onOpenCart, 
  onOpenAuth,
  currentPage, 
  navigate 
}: NavbarProps) {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileMenuClick = (page: string) => {
    navigate(page);
    setIsMobileMenuOpen(false);
  };
  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-4 md:px-8 py-5">
      <div className="glass-panel max-w-7xl mx-auto rounded-full flex justify-between items-center px-6 md:px-8 py-3">
        <button 
          onClick={() => navigate('home')}
          className="text-2xl font-black tracking-tighter text-primary hover:opacity-70 transition-opacity"
        >
          AURA.
        </button>
        
        <nav className="hidden md:flex gap-8 text-xs font-bold tracking-widest uppercase">
          <button 
            onClick={() => navigate('collections')} 
            className={`transition-colors hover:text-black ${currentPage === 'collections' ? 'text-black border-b-2 border-black' : 'text-gray-500'}`}
          >
            Collections
          </button>
          <button 
            onClick={() => navigate('new-arrivals')} 
            className={`transition-colors hover:text-black flex items-center gap-1 ${currentPage === 'new-arrivals' ? 'text-black border-b-2 border-black' : 'text-gray-500'}`}
          >
            New Arrivals
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          </button>

          <button 
            onClick={() => navigate('about')} 
            className={`transition-colors hover:text-black ${currentPage === 'about' ? 'text-black border-b-2 border-black' : 'text-gray-500'}`}
          >
            About
          </button>
        </nav>
        
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            className="hidden sm:flex items-center gap-2 px-4 py-2 hover:bg-black/5 rounded-full transition-all"
            onClick={() => user ? navigate('account') : onOpenAuth('login')}
          >
            <span className="text-xs font-bold tracking-widest uppercase">{user ? 'ACCOUNT' : 'SIGN IN'}</span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${user ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>
              {user ? user.name[0] : '?'}
            </div>
          </button>

          <button 
            className="navbar-cart-btn flex items-center gap-2 hover:opacity-70 transition-opacity relative group"
            onClick={onOpenCart}
            aria-label="Open cart"
          >
            <span className="text-sm font-bold tracking-widest uppercase hidden md:inline-block">CART</span>
            <svg className="w-5 h-5 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            <div className="bg-black text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-md group-hover:scale-110 transition-transform">
              {cartItemCount}
            </div>
          </button>

          {/* User toggle for mobile */}
          <button 
            onClick={() => user ? navigate('account') : onOpenAuth('login')}
            className="sm:hidden w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden"
          >
             {user ? <span className="text-[10px] font-black">{user.name[0]}</span> : <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
          </button>

          {/* Mobile menu toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden opacity-70 hover:opacity-100 pl-2 border-l border-gray-300"
          >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               {isMobileMenuOpen ? (
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
               ) : (
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
               )}
             </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div 
        className={`md:hidden fixed inset-0 z-50 transition-all duration-500 ease-in-out ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/40 backdrop-blur-md" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
        
        {/* Menu Panel */}
        <div 
          className={`absolute top-0 right-0 bottom-0 w-[80%] bg-white shadow-2xl transition-transform duration-500 ease-out transform ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <span className="text-xl font-black tracking-tighter">AURA.</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-8 flex flex-col">
              <button 
                onClick={() => handleMobileMenuClick('collections')} 
                className={`text-2xl font-bold tracking-tight px-8 py-4 text-left transition-colors ${currentPage === 'collections' ? 'text-black' : 'text-gray-400 hover:text-black'}`}
              >
                Collections
              </button>
              <button 
                onClick={() => handleMobileMenuClick('new-arrivals')} 
                className={`text-2xl font-bold tracking-tight px-8 py-4 text-left flex items-center justify-between transition-colors ${currentPage === 'new-arrivals' ? 'text-black' : 'text-gray-400 hover:text-black'}`}
              >
                New Arrivals
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-4"></span>
              </button>
              <button 
                onClick={() => handleMobileMenuClick('about')} 
                className={`text-2xl font-bold tracking-tight px-8 py-4 text-left transition-colors ${currentPage === 'about' ? 'text-black' : 'text-gray-400 hover:text-black'}`}
              >
                About
              </button>
            </div>

            <div className="p-8 bg-gray-50 border-t border-gray-100">
              {user ? (
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-black text-lg">
                    {user.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{user.name}</p>
                    <button 
                      onClick={() => handleMobileMenuClick('account')}
                      className="text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-black"
                    >
                      View Account
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => { onOpenAuth('login'); setIsMobileMenuOpen(false); }}
                  className="w-full bg-black text-white py-4 rounded-2xl font-bold tracking-widest uppercase text-sm mb-4 shadow-lg active:scale-95 transition-transform"
                >
                  Sign In
                </button>
              )}
              <div className="flex gap-4 justify-center opacity-40">
                 <span className="text-[10px] font-black uppercase tracking-[0.2em]">© 2026 AURA STUDIO</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
