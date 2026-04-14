import { useState } from 'react';
import ChatInterface from '../components/ChatInterface';
import LookbookCanvas from '../components/LookbookCanvas';
import type { Message, Product, StylistIntent } from '../lib/api';

interface StylistStudioProps {
  onAddToCart: (product: Product, size: string, color: string) => void;
  cart: any[];
}

export default function StylistStudio({ onAddToCart, cart }: StylistStudioProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'stylist', content: "Hi! I am your personal AI stylist. What occasion are we shopping for today?" }
  ]);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [currentIntent, setCurrentIntent] = useState<StylistIntent | undefined>();
  const [isTyping, setIsTyping] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleSendMessage = async (userMessage: string) => {
    // 1. Update UI with user's message
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      // 2. Query our newly built Phase 1 Backend Brain
      const response = await fetch(`${API_URL}/stylist/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userMessage,
          merchantId: '69de48055ba05de6331318ce' // Active AURA Merchant
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // 3. Update UI with AI's reply, the extracted intent, and the outfit
        setMessages([...newMessages, { role: 'stylist', content: data.reply }]);
        setSuggestedProducts((data.suggestedProducts || []).filter(Boolean));
        setCurrentIntent(data.intent);
      }
    } catch (error) {
      console.error("Failed to fetch outfit:", error);
      setMessages([...newMessages, { role: 'stylist', content: "I'm sorry, I'm having trouble connecting to my style database right now. Please try again in a moment." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-80px)] mt-20 overflow-hidden bg-transparent p-4 md:p-8 gap-8">
      
      {/* Sidebar / Transition Info */}
      <div className="hidden lg:flex flex-col w-64 space-y-8 animate-fade-in-left">
         <div className="glass-panel p-6 rounded-3xl">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Styling Mode</h4>
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,1)]" />
               <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">Enhanced Intelligence</span>
            </div>
         </div>
         <div className="glass-panel p-6 rounded-3xl">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Tips</h4>
            <ul className="text-[11px] text-gray-600 font-medium space-y-3 leading-relaxed">
               <li>• Mention your budget</li>
               <li>• Specify the event vibe</li>
               <li>• Ask for specific fits (oversized, slim, etc.)</li>
            </ul>
         </div>
      </div>

      {/* Left Column: Chat Interface */}
      <div className="flex-1 max-w-2xl h-full">
        <ChatInterface 
          messages={messages} 
          onSendMessage={handleSendMessage} 
          isTyping={isTyping}
        />
      </div>

      {/* Right Column: Lookbook Canvas */}
      <div className="flex-1 h-full glass-card rounded-[3rem] overflow-hidden border border-white/40 shadow-2xl relative">
        {/* Dynamic Background Ambience */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/30 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100/30 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10 h-full">
          <LookbookCanvas 
            products={suggestedProducts} 
            intent={currentIntent}
            onAddToCart={onAddToCart}
            cart={cart}
          />
        </div>
      </div>
    </div>
  );
}
