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
            className="flex items-center gap-2 hover:opacity-70 transition-opacity relative group"
            onClick={onOpenCart}
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

          {/* Mobile menu toggle (simplified for demo) */}
          <button className="md:hidden opacity-70 hover:opacity-100 pl-2 border-l border-gray-300">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
        </div>
      </div>
    </header>
  );
}
