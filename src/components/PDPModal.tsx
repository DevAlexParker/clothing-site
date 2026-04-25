import { useState } from 'react';
import type { Product } from '../data';
import { formatPrice, resolveImageUrl } from '../data';
import SizeGuide from './SizeGuide';

interface PDPModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, size: string, color: string) => void;
}

export default function PDPModal({ product, onClose, onAddToCart }: PDPModalProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const handleSelectionChange = (type: 'size' | 'color', value: any) => {
    if (type === 'size') setSelectedSize(value);
    else setSelectedColor(value);
  };

  const isLowStock = product.stock !== undefined && product.stock > 0 && product.stock <= 3;
  const isOutOfStock = product.stock !== undefined && product.stock === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="glass-card w-full max-w-5xl h-[90vh] md:h-auto md:max-h-[85vh] relative z-10 flex flex-col md:flex-row overflow-hidden rounded-3xl animate-slide-in shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/40 transition-colors shadow-sm"
        >
          ✕
        </button>

        {/* Image Gallery */}
        <div className="w-full md:w-1/2 p-3 md:p-6 flex flex-col gap-3 bg-gray-50/50 border-b md:border-b-0 md:border-r border-gray-100">
          <div className="h-72 md:h-full md:flex-1 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center relative isolate">
            <img 
              src={resolveImageUrl(product.images[selectedImage])} 
              alt={product.name} 
              className={`w-full h-full object-cover transition-opacity duration-300 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
              loading="lazy"
            />
            {product.isNewArrival && (
              <div
                className="absolute top-0 right-0 z-20 size-28 overflow-hidden pointer-events-none"
                aria-hidden
              >
                <div className="absolute -right-10 top-5 w-44 rotate-45 bg-linear-to-br from-rose-600 via-rose-500 to-orange-400 text-white text-[11px] font-black tracking-[0.28em] uppercase py-2 pl-12 text-center shadow-[0_2px_10px_rgba(0,0,0,0.35)] border-y border-white/20">
                  New
                </div>
              </div>
            )}
            {/* Stock badges on image */}
            {isLowStock && (
              <div className="absolute top-4 left-4 px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 animate-pulse">
                🔥 Only {product.stock} left in stock!
              </div>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/70 text-white px-8 py-4 rounded-2xl text-lg font-black tracking-widest uppercase">
                  Sold Out
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3 h-20 md:h-24 px-1">
            {product.images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`w-20 h-full rounded-xl overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-black' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <img src={resolveImageUrl(img)} className="w-full h-full object-cover" alt={`${product.name} thumbnail ${idx + 1}`} loading="lazy" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col overflow-y-auto bg-white/40">
          <div className="uppercase text-xs font-bold tracking-widest text-gray-500 mb-2">{product.category}</div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">{product.name}</h2>
          <div className="text-2xl font-light text-gray-700 mb-4">{formatPrice(product.price)}</div>

          {/* Stock indicator */}
          {product.stock !== undefined && (
            <div className={`mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold w-fit ${
              isOutOfStock
                ? 'bg-red-50 text-red-600 border border-red-200'
                : isLowStock
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                isOutOfStock ? 'bg-red-500' : isLowStock ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
              }`} />
              {isOutOfStock
                ? 'Out of Stock'
                : isLowStock
                ? `Hurry! Only ${product.stock} left`
                : `${product.stock} in stock`
              }
            </div>
          )}

          <div className="mb-8 p-6 glass-panel rounded-2xl border-white/60 shadow-[0_4px_16px_rgba(0,0,0,0.03)] bg-white/30">
            <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase mb-3 flex items-center justify-between">
              Color: <span className="text-gray-500 font-normal capitalize">{selectedColor.name}</span>
            </h3>
            <div className="flex gap-3">
              {product.colors.map(color => (
                <button
                  key={color.name}
                  onClick={() => handleSelectionChange('color', color)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${selectedColor.name === color.name ? 'border-black scale-110 shadow-md' : 'border-gray-200 hover:scale-105'}`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="mb-auto p-6 glass-panel rounded-2xl border-white/60 shadow-[0_4px_16px_rgba(0,0,0,0.03)] bg-white/30">
            <div className="flex justify-between items-end mb-3">
              <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Size</h3>
              <button 
                onClick={() => setShowSizeGuide(true)}
                className="text-xs text-gray-500 underline underline-offset-2 hover:text-black font-bold uppercase tracking-wider"
              >
                Size Guide
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {product.sizes.map(size => (
                <button
                  key={size}
                  onClick={() => handleSelectionChange('size', size)}
                  className={`min-w-[3rem] px-4 py-2 rounded-xl text-sm font-bold border transition-all ${selectedSize === size ? 'border-black bg-black text-white shadow-md' : 'border-gray-300 bg-white/50 text-gray-700 hover:border-black'}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <button 
              onClick={() => !isOutOfStock && onAddToCart(product, selectedSize, selectedColor.name)}
              disabled={isOutOfStock}
              className={`w-full py-5 rounded-full text-sm font-bold tracking-widest shadow-xl transition-all ${
                isOutOfStock
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'glass-dark hover:bg-black/90 hover:scale-[1.02]'
              }`}
            >
              {isOutOfStock ? 'OUT OF STOCK' : `ADD TO CART - ${formatPrice(product.price)}`}
            </button>
            <p className="text-center text-[10px] text-gray-400 uppercase font-bold opacity-60 tracking-widest">Premium Collection • 100% Guaranteed</p>
          </div>
        </div>

      </div>

      {showSizeGuide && (
        <SizeGuide 
          category={product.category} 
          onClose={() => setShowSizeGuide(false)} 
        />
      )}
    </div>
  );
}
