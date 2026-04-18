import { useState, useEffect } from 'react';
import { fetchProducts, deleteProduct, updateProductStock, formatPrice, type AdminProduct } from '../lib/api';
import ProductForm from './ProductForm.tsx';

export default function ProductsView() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState<number>(0);
  const [updatingStock, setUpdatingStock] = useState(false);

  const loadProducts = async () => {
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product.');
    }
  };

  const handleEdit = (product: AdminProduct) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const handleFormSuccess = () => {
    loadProducts();
    handleFormClose();
  };

  const handleStockEdit = (product: AdminProduct) => {
    setEditingStockId(product.id!);
    setStockValue(product.stock || 0);
  };

  const handleStockSave = async (productId: string) => {
    setUpdatingStock(true);
    try {
      const updated = await updateProductStock(productId, stockValue);
      setProducts(prev => prev.map(p => p.id === productId ? updated : p));
      setEditingStockId(null);
    } catch (error) {
      console.error('Failed to update stock:', error);
      alert('Failed to update stock.');
    } finally {
      setUpdatingStock(false);
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' };
    if (stock <= 3) return { label: 'Low Stock', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500 animate-pulse' };
    if (stock <= 10) return { label: 'Limited', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' };
    return { label: 'In Stock', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
  };

  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 3).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const totalStockValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);

  return (
    <div className="space-y-8">
      {/* Product Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Items</p>
          <p className="text-3xl font-black text-gray-900">{products.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Stock Value</p>
          <p className="text-2xl font-black text-gray-900">{formatPrice(totalStockValue)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">New Arrivals</p>
          <p className="text-3xl font-black text-emerald-600">{products.filter(p => p.isNewArrival).length}</p>
        </div>
        <div className={`p-6 rounded-2xl border shadow-sm ${lowStockCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'}`}>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Low Stock</p>
          <p className={`text-3xl font-black ${lowStockCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{lowStockCount}</p>
        </div>
        <div className={`p-6 rounded-2xl border shadow-sm ${outOfStockCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Out of Stock</p>
          <p className={`text-3xl font-black ${outOfStockCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{outOfStockCount}</p>
        </div>
      </div>

      {/* Low Stock Alert Banner */}
      {lowStockCount > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-lg shrink-0">⚠️</div>
          <div>
            <p className="text-sm font-bold text-amber-800">{lowStockCount} product{lowStockCount > 1 ? 's are' : ' is'} running low on stock</p>
            <p className="text-xs text-amber-600 mt-0.5">Products with 3 or fewer units are highlighted below. Consider restocking soon.</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Inventory Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your shop's products, prices, and stock levels.</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-6 py-3 bg-gray-900 text-white text-sm font-bold tracking-wider uppercase rounded-xl hover:bg-gray-800 transition-all flex items-center gap-2 shadow-lg shadow-gray-900/10"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Add New Product
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/80 text-[11px] uppercase tracking-wider text-gray-400 font-bold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-gray-400 font-medium">
                      No products found. Start by adding one!
                    </td>
                  </tr>
                ) : products.map(product => {
                  const stockStatus = getStockStatus(product.stock || 0);
                  const isLowOrOut = (product.stock || 0) <= 3;
                  return (
                    <tr key={product.id} className={`hover:bg-gray-50/50 transition-colors ${isLowOrOut ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100 relative">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                              </div>
                            )}
                            {isLowOrOut && (product.stock || 0) > 0 && (
                              <div className="absolute top-0 right-0 w-3 h-3 bg-amber-400 rounded-bl-lg rounded-tr-lg" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{product.name}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{product.isNewArrival ? '✨ New Arrival' : 'Standard Item'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">{formatPrice(product.price)}</td>
                      <td className="px-6 py-4">
                        {editingStockId === product.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={stockValue}
                              onChange={(e) => setStockValue(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-center"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleStockSave(product.id!);
                                if (e.key === 'Escape') setEditingStockId(null);
                              }}
                            />
                            <button
                              onClick={() => handleStockSave(product.id!)}
                              disabled={updatingStock}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Save"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                            </button>
                            <button
                              onClick={() => setEditingStockId(null)}
                              className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStockEdit(product)}
                            className="flex items-center gap-2 group/stock"
                            title="Click to edit stock"
                          >
                            <span className={`font-mono font-black text-lg ${
                              (product.stock || 0) === 0 ? 'text-red-600' :
                              (product.stock || 0) <= 3 ? 'text-amber-600' :
                              'text-gray-900'
                            }`}>
                              {product.stock || 0}
                            </span>
                            <svg className="w-3.5 h-3.5 text-gray-300 group-hover/stock:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${stockStatus.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${stockStatus.dot}`}></span>
                          {stockStatus.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Edit Product"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                          </button>
                          <button
                            onClick={() => handleDelete(product.id!)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Product"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isFormOpen && (
        <ProductForm
          product={editingProduct}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
