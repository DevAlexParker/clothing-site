import type { Product } from '../data';
import { formatPrice } from '../data';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const isLowStock = product.stock !== undefined && product.stock > 0 && product.stock <= 3;
  const isOutOfStock = product.stock !== undefined && product.stock === 0;

  return (
    <div 
      className="group cursor-pointer perspective-1000"
      onClick={() => onClick(product)}
    >
      <div 
        className="glass-card rounded-3xl p-6 h-full flex flex-col relative overflow-hidden transition-all duration-500 ease-out transform-style-3d group-hover:[transform:rotateX(5deg)_rotateY(-10deg)_translateZ(20px)] shadow-[0_4px_20px_rgba(0,0,0,0.1)] group-hover:shadow-[20px_20px_40px_rgba(0,0,0,0.2)]"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none transform -translate-x-full group-hover:translate-x-full duration-1000"></div>

        <div className="relative h-80 rounded-2xl overflow-hidden mb-6 bg-gray-100 transition-transform duration-500 ease-out transform-style-3d group-hover:[transform:translateZ(40px)] isolate">
          <img 
            src={product.images[0]} 
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
            loading="lazy"
          />
          {product.isNewArrival && (
            <div
              className="absolute top-0 right-0 z-20 size-24 overflow-hidden pointer-events-none"
              aria-hidden
            >
              <div className="absolute -right-9 top-4 w-36 rotate-45 bg-linear-to-br from-rose-600 via-rose-500 to-orange-400 text-white text-[10px] font-black tracking-[0.28em] uppercase py-1.5 pl-10 text-center shadow-[0_2px_8px_rgba(0,0,0,0.35)] border-y border-white/20">
                New
              </div>
            </div>
          )}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            <div className="glass-panel px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/80">
              {product.category}
            </div>
            {isLowStock && (
              <div className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 animate-pulse">
                🔥 ONLY {product.stock} LEFT
              </div>
            )}
            {isOutOfStock && (
              <div className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-red-500 text-white shadow-lg">
                SOLD OUT
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-auto transition-transform duration-500 ease-out transform-style-3d group-hover:[transform:translateZ(30px)]">
          <h3 className="text-xl font-semibold mb-1 text-gray-800">{product.name}</h3>
          <div className="flex justify-between items-center mt-4">
            <span className="text-lg font-light text-gray-600">{formatPrice(product.price)}</span>
            <button 
              className={`glass-panel px-6 py-2 rounded-full text-sm font-medium transition-colors duration-300 shadow-sm hover:shadow-md ${
                isOutOfStock
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'hover:bg-black hover:text-white'
              }`}
            >
              {isOutOfStock ? 'SOLD OUT' : 'VIEW'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
