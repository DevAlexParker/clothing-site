import { useState, useEffect } from 'react';
import { fetchCampaigns, createCampaign, type Campaign } from '../lib/api';

export default function CampaignsView() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [type, setType] = useState('flash_sale');
  const [message, setMessage] = useState('');

  const loadCampaigns = async () => {
    try {
      const data = await fetchCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setSubmitting(true);
    try {
      await createCampaign(type, message);
      setMessage('');
      loadCampaigns();
    } catch (error) {
      console.error('Failed to create campaign:', error);
      alert('Failed to send campaign.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeStyle = (t: string) => {
    switch (t) {
      case 'restock_alert': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'flash_sale': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'birthday_offer': return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatType = (t: string) => t.replace('_', ' ');

  return (
    <div className="space-y-8 min-w-0 max-w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-900">SMS Campaigns</h2>
          <p className="text-sm text-gray-500 mt-1">Engage opted-in customers with exclusive offers and alerts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full min-w-0">
        
        {/* Create Campaign Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
              New Campaign
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Campaign Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 text-sm font-medium appearance-none cursor-pointer"
                >
                  <option value="flash_sale">⚡ Flash Sale</option>
                  <option value="restock_alert">📦 Restock Alert</option>
                  <option value="birthday_offer">🎂 Birthday Offer</option>
                  <option value="custom">💬 Custom Message</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Message Body</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g., AURA: Our highly anticipated summer collection is back in stock! Shop now: link..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 text-sm resize-none"
                />
                <div className="flex justify-between items-center mt-1 px-1">
                  <span className="text-[10px] text-gray-400">Keep it concise and clear</span>
                  <span className={`text-[10px] font-bold ${message.length > 160 ? 'text-amber-500' : 'text-gray-400'}`}>
                    {message.length} chars
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !message.trim()}
                className="w-full px-6 py-4 bg-gray-900 text-white text-sm font-bold uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all shadow-xl shadow-gray-900/10 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-6"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Sending...
                  </span>
                ) : (
                  <>
                    <span>Dispatch SMS</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Campaign History */}
        <div className="lg:col-span-2 w-full min-w-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden w-full min-w-0 flex flex-col h-full">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Campaign History</h3>
            </div>
            
            {loading ? (
              <div className="p-20 flex justify-center">
                <div className="w-8 h-8 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin"></div>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="p-20 text-center text-gray-400">
                <svg className="w-12 h-12 mx-auto text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                <p className="font-medium text-sm">No SMS campaigns dispatched yet.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead className="bg-gray-50/80 text-[10px] uppercase tracking-wider text-gray-400 font-bold border-b border-gray-100 sticky top-0">
                    <tr>
                      <th className="px-6 py-4">Status & Type</th>
                      <th className="px-6 py-4">Message Preview</th>
                      <th className="px-6 py-4">Audience</th>
                      <th className="px-6 py-4">Dispatched At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {campaigns.map((c) => (
                      <tr key={c._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-5 align-top">
                          <div className="flex flex-col gap-2 items-start">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getTypeStyle(c.type)}`}>
                              {formatType(c.type)}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              {c.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 align-top max-w-xs">
                          <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{c.message}</p>
                        </td>
                        <td className="px-6 py-5 align-top">
                          <p className="text-sm font-black text-gray-900">{c.audienceCount}</p>
                          <p className="text-[10px] text-gray-400 uppercase font-bold mt-0.5">Recipients</p>
                        </td>
                        <td className="px-6 py-5 align-top">
                          <p className="text-xs font-bold text-gray-900">
                            {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(c.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
