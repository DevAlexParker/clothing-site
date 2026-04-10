import { useState, useMemo } from 'react';
import type { Product } from '../data';
import { products, formatPrice } from '../data';
import ProductCard from '../components/ProductCard';

interface CollectionsProps {
  onProductClick: (product: Product) => void;
  initialFilter?: string; // e.g. 'new-arrivals'
}

type PriceRange = 'all' | 'under10k' | '10k-20k' | 'over20k';

export default function Collections({ onProductClick, initialFilter = 'all' }: CollectionsProps) {
  const [categoryFilter, setCategoryFilter] = useState(initialFilter);
  const [priceFilter, setPriceFilter] = useState<PriceRange>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  const categories = ['all', 'Outerwear', 'Dresses', 'Tailoring', 'Basics', 'Bottoms', 'Accessories', 'new-arrivals'];

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Category match
      let catMatch = false;
      if (categoryFilter === 'all') catMatch = true;
      else if (categoryFilter === 'new-arrivals') catMatch = !!product.isNew;
      else catMatch = product.category.toLowerCase() === categoryFilter.toLowerCase();

      // Price match
      let priceMatch = false;
      if (priceFilter === 'all') priceMatch = true;
      else if (priceFilter === 'under10k') priceMatch = product.price < 10000;
      else if (priceFilter === '10k-20k') priceMatch = product.price >= 10000 && product.price <= 20000;
      else if (priceFilter === 'over20k') priceMatch = product.price > 20000;

      return catMatch && priceMatch;
    });
  }, [categoryFilter, priceFilter]);

  const clearFilters = () => {
    setCategoryFilter('all');
    setPriceFilter('all');
  };

  return (
    <div className="animate-fade-in relative z-10 w-full pt-32 pb-32 px-8 max-w-7xl mx-auto">
      <div className="flex flex-col mb-12 border-b border-gray-200 pb-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight mb-4 capitalize">
              {categoryFilter === 'new-arrivals' ? 'New Arrivals' : categoryFilter === 'all' ? 'All Collections' : categoryFilter}
            </h1>
            <p className="text-gray-500 font-light">Elevate your wardrobe with our meticulously crafted pieces.</p>
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="hidden md:flex items-center gap-2 glass-panel px-6 py-3 rounded-full text-sm font-bold tracking-widest uppercase hover:bg-black hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
            Filters
          </button>
        </div>
        
        {/* Mobile Filter Toggle */}
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden flex items-center justify-center gap-2 glass-panel w-full py-3 mb-6 rounded-xl text-sm font-bold tracking-widest uppercase"
        >
          Filters {(categoryFilter !== 'all' || priceFilter !== 'all') && '(Active)'}
        </button>

        {/* Filter Panel */}
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 md:max-h-96 md:opacity-100'}`}>
          <div className="flex flex-col md:flex-row gap-8 bg-white/50 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm mb-4">
            
            <div className="flex-1">
              <h3 className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-4">Category</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all ${categoryFilter === cat ? 'bg-black text-white' : 'bg-white/60 hover:bg-white text-gray-600 border border-transparent hover:border-gray-200'}`}
                  >
                    {cat === 'new-arrivals' ? 'New Arrivals' : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 md:border-l border-gray-200 md:pl-8">
              <h3 className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-4">Price Range</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setPriceFilter('all')}
                  className={`px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all ${priceFilter === 'all' ? 'bg-black text-white' : 'bg-white/60 hover:bg-white text-gray-600 border border-transparent hover:border-gray-200'}`}
                >
                  Any Price
                </button>
                <button
                  onClick={() => setPriceFilter('under10k')}
                  className={`px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all ${priceFilter === 'under10k' ? 'bg-black text-white' : 'bg-white/60 hover:bg-white text-gray-600 border border-transparent hover:border-gray-200'}`}
                >
                  Under {formatPrice(10000)}
                </button>
                <button
                  onClick={() => setPriceFilter('10k-20k')}
                  className={`px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all ${priceFilter === '10k-20k' ? 'bg-black text-white' : 'bg-white/60 hover:bg-white text-gray-600 border border-transparent hover:border-gray-200'}`}
                >
                  {formatPrice(10000)} - {formatPrice(20000)}
                </button>
                <button
                  onClick={() => setPriceFilter('over20k')}
                  className={`px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all ${priceFilter === 'over20k' ? 'bg-black text-white' : 'bg-white/60 hover:bg-white text-gray-600 border border-transparent hover:border-gray-200'}`}
                >
                  Over {formatPrice(20000)}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} onClick={onProductClick} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="py-20 text-center glass-panel rounded-3xl mt-8">
          <p className="text-gray-500 text-lg">No products found matching your filters.</p>
          <button onClick={clearFilters} className="mt-4 underline underline-offset-4 text-sm font-bold tracking-widest uppercase hover:text-gray-500">Clear All Filters</button>
        </div>
      )}
    </div>
  );
}
