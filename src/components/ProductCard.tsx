import type { Product } from '../data';
import { formatPrice, resolveImageUrl } from '../data';

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
        className="glass-card rounded-2xl md:rounded-3xl p-3 md:p-6 h-full flex flex-col relative overflow-hidden transition-all duration-500 ease-out transform-style-3d group-hover:[transform:rotateX(5deg)_rotateY(-10deg)_translateZ(20px)] shadow-[0_4px_20px_rgba(0,0,0,0.1)] group-hover:shadow-[20px_20px_40px_rgba(0,0,0,0.2)]"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none transform -translate-x-full group-hover:translate-x-full duration-1000"></div>

        <div className="relative h-48 md:h-80 rounded-xl md:rounded-2xl overflow-hidden mb-3 md:mb-6 bg-gray-100 transition-transform duration-500 ease-out transform-style-3d group-hover:[transform:translateZ(40px)] isolate">
          <img 
            src={resolveImageUrl(product.images[0])} 
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
          <div className="absolute top-2 left-2 md:top-4 md:left-4 flex flex-col gap-1.5 md:gap-2 z-10">
            <div className="glass-panel px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[8px] md:text-[10px] font-bold tracking-wider uppercase bg-white/80">
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
          <h3 className="text-sm md:text-xl font-semibold mb-0.5 md:mb-1 text-gray-800 line-clamp-1">{product.name}</h3>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-2 md:mt-4 gap-2">
            <span className="text-sm md:text-lg font-light text-gray-600">{formatPrice(product.price)}</span>
            <button 
              className={`glass-panel w-full md:w-auto px-4 md:px-6 py-1.5 md:py-2 rounded-full text-[10px] md:text-sm font-bold transition-colors duration-300 shadow-sm hover:shadow-md uppercase tracking-wider ${
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
