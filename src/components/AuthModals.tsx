import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType: 'login' | 'signup';
}

export default function AuthModals({ isOpen, onClose, initialType }: AuthModalProps) {
  const [type, setType] = useState(initialType);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login: authLogin } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = type === 'login' ? '/auth/login' : '/auth/register';
    const payload = type === 'login' 
      ? { email, password } 
      : { name, email, password, phone };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      authLogin(data.token, data.user);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
      
      <div className="glass-card w-full max-w-md relative z-10 p-8 sm:p-10 rounded-[2.5rem] border border-white/50 animate-fade-up overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-200/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          <button onClick={onClose} className="absolute top-0 right-0 p-2 text-gray-400 hover:text-black transition-colors">✕</button>
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black tracking-tight text-gray-900 mb-2">
              {type === 'login' ? 'Welcome Back' : 'Join AURA'}
            </h2>
            <p className="text-gray-500 text-sm">
              {type === 'login' ? 'Enter your details to access your account' : 'Meticulously crafted staples for a modern wardrobe'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {type === 'signup' && (
              <div className="space-y-4 animate-fade-in">
                <input 
                  type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required
                  className="w-full glass-panel px-6 py-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-black/10 focus:bg-white/90 transition-all font-medium"
                />
                <input 
                  type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full glass-panel px-6 py-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-black/10 focus:bg-white/90 transition-all font-medium"
                />
              </div>
            )}
            
            <input 
              type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full glass-panel px-6 py-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-black/10 focus:bg-white/90 transition-all font-medium"
            />
            
            <input 
              type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full glass-panel px-6 py-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-black/10 focus:bg-white/90 transition-all font-medium"
            />

            {error && <p className="text-xs text-red-500 text-center font-medium animate-shake">{error}</p>}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full glass-dark py-4 rounded-full text-sm font-bold tracking-widest hover:bg-black/90 hover:scale-[1.02] shadow-xl transition-all disabled:opacity-50"
            >
              {loading ? 'PROCESSING...' : type === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {type === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
              <button onClick={() => setType(type === 'login' ? 'signup' : 'login')} className="text-black font-bold hover:underline">
                {type === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
