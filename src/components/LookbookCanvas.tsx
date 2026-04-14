import React from 'react';
import type { Product, StylistIntent } from '../lib/api';
import { formatPrice } from '../data';

interface LookbookCanvasProps {
  products: Product[];
  intent?: StylistIntent;
}

export default function LookbookCanvas({ products, intent }: LookbookCanvasProps) {
  if (products.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6">
        <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center opacity-40">
           <svg className="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
           </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">Your Custom Lookbook</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-xs leading-relaxed">Describe an occasion or style to see AI-curated outfits appear here in real-time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-8 space-y-8 animate-fade-in overflow-y-auto scrollbar-hide">
      {/* Intent Badge */}
      {intent && (
        <div className="flex flex-wrap gap-3">
          <div className="glass-panel px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase border border-black/5">
            Event: {intent.occasion}
          </div>
          <div className="glass-panel px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase border border-black/5">
            Style: {intent.style}
          </div>
          {intent.budget && (
             <div className="glass-panel px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase border border-black/5">
               Budget: Under Rs. {intent.budget}
             </div>
          )}
        </div>
      )}

      {/* Recommended Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((item, idx) => (
          <div key={idx} className="group relative glass-card rounded-3xl overflow-hidden hover:scale-[1.02] transition-all duration-500 shadow-xl border border-white/50">
            <div className="aspect-[3/4] overflow-hidden">
                <img 
                  src={(item.images && item.images.length > 0) ? item.images[0] : 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800'} 
                  alt={item.name} 
                  className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700" 
                />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white translate-y-2 group-hover:translate-y-0 transition-transform">
               <p className="text-[10px] font-bold tracking-widest uppercase opacity-70 mb-1">{item.category}</p>
               <h4 className="text-lg font-bold tracking-tight">{item.name}</h4>
               <div className="flex justify-between items-center mt-4">
                 <p className="text-sm font-light opacity-90">{formatPrice(item.price)}</p>
                 <button className="text-[9px] font-black tracking-widest uppercase bg-white text-black px-4 py-2 rounded-full hover:bg-black hover:text-white transition-colors">
                   ADD TO LOOK
                 </button>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Look Summary */}
      <div className="glass-card p-10 rounded-[3rem] text-center border border-white bg-white/40 backdrop-blur-3xl shadow-2xl relative overflow-hidden mt-auto">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 blur-3xl rounded-full translate-x-10 -translate-y-10" />
        <h3 className="text-2xl font-black tracking-tighter text-gray-900 mb-2">The Complete Look</h3>
        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-6">Curated specifically for you</p>
        <div className="flex justify-center items-center gap-8 mb-8">
           <div className="text-center">
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Items</p>
             <p className="text-xl font-black">{products.length}</p>
           </div>
           <div className="w-px h-8 bg-gray-200" />
           <div className="text-center">
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total</p>
             <p className="text-xl font-black">{formatPrice(products.reduce((sum, p) => sum + p.price, 0))}</p>
           </div>
        </div>
        <button className="w-full glass-dark py-5 rounded-full text-xs font-black tracking-[0.2em] shadow-xl hover:scale-[1.03] transition-all">
          ADD OUTFIT TO CART
        </button>
      </div>
    </div>
  );
}
