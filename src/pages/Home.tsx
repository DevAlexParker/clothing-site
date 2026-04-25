import { useState, useEffect } from 'react';
import type { Product } from '../data';
import { fetchProducts } from '../lib/api';
import ProductCard from '../components/ProductCard';

interface HomeProps {
  onProductClick: (product: Product) => void;
  navigate: (page: string) => void;
}

export default function Home({ onProductClick, navigate }: HomeProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts()
      .then(data => setProducts(data))
      .catch(err => console.error('Failed to load products:', err))
      .finally(() => setLoading(false));
  }, []);

  const featuredProducts = products.slice(0, 8);

  return (
    <div className="animate-fade-in relative z-10 w-full pt-10">
      {/* Hero Section */}
      <section className="pt-16 pb-12 md:pt-24 md:pb-20 px-6 md:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="glass-panel px-5 py-2 rounded-full mb-6 md:mb-8 flex items-center gap-2 cursor-pointer hover:bg-white/90" onClick={() => navigate('collections')}>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] md:tracking-widest uppercase">Spring/Summer '26 Drop</span>
        </div>
        <h2 className="text-4xl sm:text-5xl md:text-8xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500 mb-6 drop-shadow-sm leading-[1.1]">
          Simplicity is <br className="hidden sm:block" /> the ultimate sophistication.
        </h2>
        <p className="text-base md:text-xl text-gray-500 max-w-2xl mb-10 md:mb-12 font-light leading-relaxed px-4 md:px-0">
          Discover our new Spring/Summer collection. Elevate your everyday with premium materials and timeless silhouettes designed for the modern aesthetic.
        </p>
        <button 
          onClick={() => navigate('collections')}
          className="glass-dark px-8 md:px-10 py-4 md:py-5 rounded-full text-xs md:text-sm font-semibold tracking-widest hover:scale-105 hover:bg-black/90 transition-all duration-300 shadow-xl"
        >
          EXPLORE THE COLLECTION
        </button>
      </section>

      {/* Featured Grid */}
      <section className="px-6 md:px-8 pb-20 md:pb-32 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8 md:mb-12">
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight">Featured Pieces</h3>
          <button 
            onClick={() => navigate('collections')}
            className="text-sm font-bold tracking-widest hover:text-gray-500 transition-colors uppercase underline underline-offset-4"
          >
            View All
          </button>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass-card rounded-3xl p-6 animate-pulse">
                <div className="h-80 rounded-2xl bg-gray-200 mb-6"></div>
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} onClick={onProductClick} />
            ))}
          </div>
        )}
      </section>
      
      {/* Secondary Hero Image / Banner */}
      <section className="px-4 pb-20 md:pb-32 max-w-7xl mx-auto">
        <div className="w-full h-[28rem] md:h-[30rem] rounded-3xl overflow-hidden relative glass-card p-2">
          <div className="w-full h-full rounded-2xl overflow-hidden relative">
            <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=2000" alt="AURA brand lifestyle editorial featuring modern wardrobe staples" className="w-full h-full object-cover object-center grayscale hover:grayscale-0 transition-all duration-1000" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-12">
              <h3 className="text-3xl md:text-4xl text-white font-bold mb-6 max-w-md">Redefining Wardrobe Staples.</h3>
              <button onClick={() => navigate('about')} className="self-start bg-white text-gray-900 border border-white/80 hover:bg-gray-50 px-8 py-3 rounded-full text-xs font-bold tracking-widest transition-all shadow-sm uppercase">
                OUR STORY
              </button>
            </div>
          </div>
        </div>
      </section>
      {/* Delivery Info Section */}
      <section className="px-6 md:px-8 pb-12 max-w-7xl mx-auto">
        <div className="glass-panel p-8 md:p-12 rounded-[2.5rem] grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 text-center bg-white/40 border-white/60">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mb-6 shadow-lg shadow-black/20">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1.28a2 2 0 102.822-.008C13.107 16.99 13 16.51 13 16m-6-1a1 1 0 001 1h1.28a2 2 0 102.822-.008C7.107 16.99 7 16.51 7 16"></path></svg>
            </div>
            <h4 className="text-lg font-bold mb-2 text-gray-900">Island-wide Delivery</h4>
            <p className="text-gray-500 font-light text-sm leading-relaxed">We securely package and deliver your orders directly to your doorstep anywhere in Sri Lanka.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mb-6 shadow-lg shadow-black/20">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h4 className="text-lg font-bold mb-2 text-gray-900">2-3 Working Days</h4>
            <p className="text-gray-500 font-light text-sm leading-relaxed">Prompt and reliable estimated standard shipping times across all major cities and suburbs.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mb-6 shadow-lg shadow-black/20">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zM7 19h1m-1 0a2 2 0 01-2-2v-6a2 2 0 012-2h1m10 4V7m0 12h1m-1 0a2 2 0 002-2V7a2 2 0 00-2-2h-1M9 19h10"></path></svg>
            </div>
            <h4 className="text-lg font-bold mb-2 text-gray-900">Cash on Delivery</h4>
            <p className="text-gray-500 font-light text-sm leading-relaxed">Convenient Cash on Delivery available offline. Checkout softly now and pay precisely at your door.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
