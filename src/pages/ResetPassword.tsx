import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ResetPasswordProps {
  token: string;
  onDone: () => void;
}

export default function ResetPassword({ token, onDone }: ResetPasswordProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      login(data.token, data.user);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 flex justify-center">
      <div className="glass-card p-10 rounded-[3rem] max-w-md w-full">
        <h1 className="text-2xl font-black mb-2 text-gray-900">Set a new password</h1>
        <p className="text-sm text-gray-500 mb-8">Choose a strong password for your account.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full glass-panel px-6 py-4 rounded-2xl text-sm outline-none"
            placeholder="New password"
            autoComplete="new-password"
          />
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            minLength={8}
            className="w-full glass-panel px-6 py-4 rounded-2xl text-sm outline-none"
            placeholder="Confirm password"
            autoComplete="new-password"
          />
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full glass-dark py-4 rounded-full text-sm font-bold tracking-widest disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'UPDATE PASSWORD'}
          </button>
        </form>
      </div>
    </div>
  );
}
