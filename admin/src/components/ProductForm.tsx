import { useState, useEffect } from 'react';
import { createProduct, updateProduct, uploadProductImage, type AdminProduct } from '../lib/api';

interface ProductFormProps {
  product: AdminProduct | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = ['T-Shirts', 'Hoodies', 'Pants', 'Accessories', 'New Arrivals'];
const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export default function ProductForm({ product, onClose, onSuccess }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AdminProduct>({
    name: '',
    price: 0,
    category: 'T-Shirts',
    images: [''],
    colors: [{ name: '', hex: '#000000' }],
    sizes: [],
    stock: 0,
    isNewArrival: false,
    gender: 'unisex',
  });

  useEffect(() => {
    if (product) {
      setFormData(product);
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        images: formData.images.filter(img => img.trim() !== ''),
      };
      
      if (product?.id) {
        await updateProduct(product.id, payload);
      } else {
        await createProduct(payload);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product. Please check your data.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = (field: 'images' | 'colors') => {
    if (field === 'images') {
      setFormData({ ...formData, images: [...formData.images, ''] });
    } else {
      setFormData({ ...formData, colors: [...formData.colors, { name: '', hex: '#000000' }] });
    }
  };

  const handleRemoveField = (field: 'images' | 'colors', index: number) => {
    if (field === 'images') {
      const newImages = [...formData.images];
      newImages.splice(index, 1);
      setFormData({ ...formData, images: newImages });
    } else {
      const newColors = [...formData.colors];
      newColors.splice(index, 1);
      setFormData({ ...formData, colors: newColors });
    }
  };

  const toggleSize = (size: string) => {
    const newSizes = formData.sizes.includes(size)
      ? formData.sizes.filter(s => s !== size)
      : [...formData.sizes, size];
    setFormData({ ...formData, sizes: newSizes });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const url = await uploadProductImage(file);
      const newImgs = [...formData.images];
      newImgs[index] = url;
      setFormData({ ...formData, images: newImgs });
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-xl font-black text-gray-900">{product ? 'Edit Product' : 'Add New Product'}</h3>
            <p className="text-xs text-gray-500 mt-1">Fill in the details below to update your store.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl shadow-sm transition-all text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <form id="productForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Product Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all text-sm font-medium"
                placeholder="e.g. Premium Cotton Hoodie"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Price (LKR)</label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all text-sm font-medium font-mono"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Category</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all text-sm font-medium appearance-none"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Stock Qty</label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={e => setFormData({ ...formData, stock: Math.max(0, Number(e.target.value)) })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all text-sm font-medium font-mono"
                placeholder="0"
              />
            </div>
            <div className="flex items-center pt-8">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-12 h-6 rounded-full transition-all flex items-center p-1 ${formData.isNewArrival ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-all transform ${formData.isNewArrival ? 'translate-x-6' : 'translate-x-0 shadow-sm'}`} />
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={!!formData.isNewArrival}
                  onChange={e => setFormData({ ...formData, isNewArrival: e.target.checked })}
                />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest group-hover:text-gray-900 transition-colors">New Arrival</span>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Gender Target (For AI Try-On)</label>
            <div className="flex gap-4">
              {['men', 'women', 'unisex'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: g as any })}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest border-2 transition-all ${
                    formData.gender === g 
                      ? 'bg-gray-900 border-gray-900 text-white shadow-lg' 
                      : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Images (URLs)</label>
              <button type="button" onClick={() => handleAddField('images')} className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-tighter">Add More</button>
            </div>
            <div className="space-y-3">
              {formData.images.map((img, idx) => (
                <div key={idx} className="flex gap-2">
                  <div className="relative flex-1 group">
                    <input
                      type="text"
                      required
                      value={img}
                      onChange={e => {
                        const newImgs = [...formData.images];
                        newImgs[idx] = e.target.value;
                        setFormData({ ...formData, images: newImgs });
                      }}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 text-sm"
                      placeholder="https://images.unsplash.com/ or local upload..."
                    />
                    <label className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1.5 hover:bg-white rounded-lg transition-all shadow-sm group-hover:scale-105 active:scale-95">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleFileUpload(e, idx)}
                      />
                    </label>
                  </div>
                  {formData.images.length > 1 && (
                    <button type="button" onClick={() => handleRemoveField('images', idx)} className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-all">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Available Sizes</label>
            <div className="flex gap-3">
              {SIZES.map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center font-bold text-sm ${
                    formData.sizes.includes(size)
                      ? 'bg-gray-900 border-gray-900 text-white shadow-lg shadow-gray-900/20'
                      : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Colors</label>
              <button type="button" onClick={() => handleAddField('colors')} className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-tighter">Add More</button>
            </div>
            <div className="space-y-3">
              {formData.colors.map((color, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <input
                    type="text"
                    required
                    value={color.name}
                    onChange={e => {
                      const newColors = [...formData.colors];
                      newColors[idx].name = e.target.value;
                      setFormData({ ...formData, colors: newColors });
                    }}
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 text-sm"
                    placeholder="Color Name (e.g. Jet Black)"
                  />
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-gray-200 shadow-sm shrink-0">
                    <input
                      type="color"
                      value={color.hex}
                      onChange={e => {
                        const newColors = [...formData.colors];
                        newColors[idx].hex = e.target.value;
                        setFormData({ ...formData, colors: newColors });
                      }}
                      className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                    />
                  </div>
                  {formData.colors.length > 1 && (
                    <button type="button" onClick={() => handleRemoveField('colors', idx)} className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-all">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-4 bg-white border border-gray-200 text-gray-600 text-sm font-bold uppercase tracking-widest rounded-2xl hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="productForm"
            disabled={loading}
            className="flex-[2] px-6 py-4 bg-gray-900 text-white text-sm font-bold uppercase tracking-widest rounded-2xl hover:bg-gray-800 transition-all shadow-xl shadow-gray-900/20 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                Saving...
              </span>
            ) : (
              product ? 'Update Product' : 'Create Product'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
