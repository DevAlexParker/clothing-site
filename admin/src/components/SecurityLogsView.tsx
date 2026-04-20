import { useState, useEffect } from 'react';

interface AuditLog {
  _id: string;
  userId?: { name: string; email: string };
  action: string;
  targetType: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  metadata: any;
}

export default function SecurityLogsView() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/audit-logs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('aura_token')}`
        }
      });
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('LOGIN')) return 'text-blue-600';
    if (action.includes('DELETE')) return 'text-red-600';
    if (action.includes('UPDATE')) return 'text-amber-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Administrative Audit Trails</h3>
          <button onClick={fetchLogs} className="text-xs font-bold text-gray-400 hover:text-black">REFRESH</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Timestamp</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Admin</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Action</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Target</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-400">Loading audit logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-400">No logs found</td></tr>
              ) : logs.map(log => (
                <tr key={log._id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-8 py-4 text-xs font-medium text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-8 py-4">
                    <p className="text-xs font-bold text-gray-900">{log.userId?.name || 'System / Initial'}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{log.userId?.email || 'N/A'}</p>
                  </td>
                  <td className={`px-8 py-4 text-xs font-black tracking-wider ${getActionColor(log.action)}`}>
                    {log.action}
                  </td>
                  <td className="px-8 py-4 text-xs font-bold text-gray-600">{log.targetType}</td>
                  <td className="px-8 py-4 text-xs font-mono text-gray-400">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
