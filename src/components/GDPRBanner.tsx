import { useState, useEffect } from 'react';

export default function GDPRBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('aura_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('aura_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-8 left-8 right-8 md:left-auto md:max-w-md z-50 animate-fade-up">
      <div className="glass-card p-6 rounded-[2rem] border border-white/50 shadow-2xl backdrop-blur-xl bg-white/80">
        <h3 className="text-sm font-bold text-gray-900 mb-2 tracking-tight">Privacy Preference</h3>
        <p className="text-[11px] text-gray-500 leading-relaxed mb-4">
          We use cookies to enhance your cinematic shopping experience and analyze our traffic. By clicking "Accept", you consent to our use of cookies.
        </p>
        <div className="flex gap-3">
          <button 
            onClick={accept}
            className="flex-1 glass-dark py-3 rounded-full text-[10px] font-black tracking-widest hover:scale-[1.02] transition-all"
          >
            ACCEPT ALL
          </button>
          <button 
            onClick={() => setIsVisible(false)}
            className="px-6 border border-gray-200 py-3 rounded-full text-[10px] font-bold text-gray-400 hover:text-black hover:border-black transition-all"
          >
            DECLINE
          </button>
        </div>
      </div>
    </div>
  );
}
