import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchAdminNotifications, type AdminNotificationItem } from '../lib/api';

const SEEN_KEY = 'aura_admin_notifications_seen_at';

export default function AdminNotifications() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchAdminNotifications();
      setItems(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = window.setInterval(load, 45000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const [seenAt, setSeenAt] = useState(() => localStorage.getItem(SEEN_KEY) || '');

  const unreadCount = useMemo(() => {
    if (!seenAt) return items.length;
    const t = new Date(seenAt).getTime();
    return items.filter((n) => new Date(n.createdAt).getTime() > t).length;
  }, [items, seenAt]);

  const markSeen = () => {
    const iso = new Date().toISOString();
    localStorage.setItem(SEEN_KEY, iso);
    setSeenAt(iso);
  };

  const handleToggle = () => {
    if (!open) {
      setOpen(true);
      markSeen();
    } else {
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-gray-900 transition-colors shadow-sm"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-red-500 text-[10px] font-black text-white flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(100vw-2rem,22rem)] max-h-[min(70vh,24rem)] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl z-50 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80">
            <p className="text-xs font-black uppercase tracking-widest text-gray-500">Notifications</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Inventory &amp; orders</p>
          </div>
          <div className="overflow-y-auto flex-1">
            {loading && items.length === 0 ? (
              <p className="p-6 text-sm text-gray-400 text-center">Loading…</p>
            ) : error ? (
              <p className="p-6 text-sm text-red-500 text-center">{error}</p>
            ) : items.length === 0 ? (
              <p className="p-6 text-sm text-gray-400 text-center">You&apos;re all caught up.</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {items.map((n) => (
                  <li key={n.id} className="px-4 py-3 hover:bg-gray-50/80 transition-colors">
                    <div className="flex gap-2 items-start">
                      <span className="text-lg shrink-0" aria-hidden>
                        {n.type === 'new_order' ? '🛒' : n.type === 'out_of_stock' ? '📭' : '⚠️'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900">{n.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5 leading-snug">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(n.createdAt).toLocaleString(undefined, {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
