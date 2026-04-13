import { useState } from 'react';
import OrdersView from './components/OrdersView';
import ProductsView from './components/ProductsView';

export default function App() {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen">
        <div className="p-8">
          <h1 className="text-3xl font-black tracking-tighter text-gray-900 flex items-center gap-2">
            AURA
            <span className="w-2 h-2 bg-gray-900 rounded-full mt-2"></span>
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">Admin Control</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${
              activeTab === 'orders' 
                ? 'bg-gray-900 text-white shadow-xl shadow-gray-900/10' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className={`w-5 h-5 transition-colors ${activeTab === 'orders' ? 'text-white' : 'text-gray-400 group-hover:text-gray-900'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="font-bold text-sm tracking-wide">Orders</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${
              activeTab === 'inventory' 
                ? 'bg-gray-900 text-white shadow-xl shadow-gray-900/10' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className={`w-5 h-5 transition-colors ${activeTab === 'inventory' ? 'text-white' : 'text-gray-400 group-hover:text-gray-900'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="font-bold text-sm tracking-wide">Inventory</span>
          </button>
        </nav>

        <div className="p-8 border-t border-gray-50">
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-200 to-gray-100 flex items-center justify-center font-bold text-gray-500">A</div>
              <div>
                <p className="text-xs font-bold text-gray-900">Admin Staff</p>
                <p className="text-[10px] text-gray-400">Shop Manager</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Overview</h2>
            <h3 className="text-3xl font-black text-gray-900">
              {activeTab === 'orders' ? 'Order Management' : 'Product Inventory'}
            </h3>
          </div>
          <div className="flex gap-4">
            <button className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-gray-900 transition-colors shadow-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </button>
          </div>
        </header>

        {activeTab === 'orders' ? <OrdersView /> : <ProductsView />}
      </main>
    </div>
  );
}
