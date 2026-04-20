import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType: 'login' | 'signup';
}

type Flow = 'login' | 'signup' | 'verify' | 'forgot';

export default function AuthModals({ isOpen, onClose, initialType }: AuthModalProps) {
  const [flow, setFlow] = useState<Flow>('login');
  const [type, setType] = useState(initialType);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState('');

  const { login: authLogin } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (isOpen) {
      setFlow(initialType === 'signup' ? 'signup' : 'login');
      setType(initialType);
      setError('');
      setInfo('');
      setVerifyCode('');
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const handleLoginSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    const endpoint = type === 'login' ? '/auth/login' : '/auth/register';
    const payload = type === 'login' ? { email, password } : { name, email, password, phone };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403 && data.code === 'EMAIL_NOT_VERIFIED') {
          setPendingEmail(data.email || email);
          setFlow('verify');
          setInfo('Enter the code sent to your email.');
          setLoading(false);
          return;
        }
        throw new Error(data.error || 'Request failed');
      }

      if (type === 'signup' && data.requiresVerification) {
        setPendingEmail(data.email);
        setFlow('verify');
        setInfo(data.message || 'Check your email for a 6-digit code.');
        setLoading(false);
        return;
      }

      authLogin(data.token, data.user);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail, code: verifyCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      authLogin(data.token, data.user);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setInfo(data.message || 'Check your email for a reset link.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
      <div className="glass-card w-full max-w-md relative z-10 p-10 rounded-[2.5rem] border border-white/50 animate-fade-up">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-black">✕</button>

        {flow === 'verify' ? (
          <div className="text-center">
            <h2 className="text-2xl font-black mb-2">Verify Email</h2>
            <p className="text-gray-500 text-sm mb-6">Code sent to {pendingEmail}</p>
            <form onSubmit={handleVerify} className="space-y-4">
              <input 
                type="text" maxLength={6} placeholder="000000" 
                value={verifyCode} onChange={e => setVerifyCode(e.target.value)} 
                className="w-full glass-panel px-6 py-4 rounded-2xl text-center font-mono text-xl tracking-[0.3em] outline-none"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              {info && <p className="text-xs text-emerald-600">{info}</p>}
              <button disabled={loading} className="w-full glass-dark py-4 rounded-full font-bold tracking-widest">VERIFY</button>
              <button type="button" onClick={() => setFlow('login')} className="text-xs text-gray-400">Back to Login</button>
            </form>
          </div>
        ) : flow === 'forgot' ? (
          <div className="text-center">
            <h2 className="text-2xl font-black mb-2">Forgot Password</h2>
            <p className="text-gray-500 text-sm mb-6">Enter your email to receive a reset link.</p>
            <form onSubmit={handleForgot} className="space-y-4">
              <input 
                type="email" placeholder="Email Address" required
                value={email} onChange={e => setEmail(e.target.value)} 
                className="w-full glass-panel px-6 py-4 rounded-2xl text-sm outline-none"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              {info && <p className="text-xs text-emerald-600">{info}</p>}
              <button disabled={loading} className="w-full glass-dark py-4 rounded-full font-bold tracking-widest">SEND RESET LINK</button>
              <button type="button" onClick={() => setFlow('login')} className="text-xs text-gray-400">Back to Login</button>
            </form>
          </div>
        ) : (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black tracking-tight text-gray-900 mb-2">{type === 'login' ? 'Welcome Back' : 'Join AURA'}</h2>
              <p className="text-gray-500 text-sm">{type === 'login' ? 'Sign in to access your profile' : 'Create an account for a tailored experience'}</p>
            </div>
            <form onSubmit={handleLoginSignup} className="space-y-4">
              {type === 'signup' && (
                <>
                  <input type="text" placeholder="Name" required value={name} onChange={e => setName(e.target.value)} className="w-full glass-panel px-6 py-4 rounded-2xl text-sm" />
                  <input type="tel" placeholder="Phone (Optional)" value={phone} onChange={e => setPhone(e.target.value)} className="w-full glass-panel px-6 py-4 rounded-2xl text-sm" />
                </>
              )}
              <input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full glass-panel px-6 py-4 rounded-2xl text-sm" />
              <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full glass-panel px-6 py-4 rounded-2xl text-sm" />
              
              {type === 'login' && (
                <div className="text-right">
                  <button type="button" onClick={() => setFlow('forgot')} className="text-xs text-gray-400 hover:text-black">Forgot Password?</button>
                </div>
              )}

              {error && <p className="text-xs text-red-500 text-center animate-shake">{error}</p>}
              <button disabled={loading} className="w-full glass-dark py-4 rounded-full text-sm font-bold tracking-widest outline-none">{loading ? '...' : type === 'login' ? 'SIGN IN' : 'SIGN UP'}</button>
            </form>
            <div className="mt-8 text-center pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                {type === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button onClick={() => setType(type === 'login' ? 'signup' : 'login')} className="text-black font-bold hover:underline">{type === 'login' ? 'Sign Up' : 'Sign In'}</button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
