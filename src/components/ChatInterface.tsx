import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '../lib/api';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isTyping?: boolean;
}

export default function ChatInterface({ messages, onSendMessage, isTyping }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full glass-card rounded-[2.5rem] overflow-hidden border border-white/40 shadow-2xl">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100 bg-white/20 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center font-black animate-pulse shadow-lg">
            A
          </div>
          <div>
            <h2 className="font-bold text-gray-900 tracking-tight">AI Stylist</h2>
            <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest">Online & Ready</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide"
      >
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div 
              className={`max-w-[85%] px-6 py-4 rounded-3xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-black text-white rounded-tr-none' 
                  : 'bg-white/80 text-gray-800 rounded-tl-none border border-gray-100'
              }`}
            >
              {msg.role === 'user' ? (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              ) : (
                <div className="markdown-content text-gray-800 space-y-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white/80 px-6 py-4 rounded-3xl rounded-tl-none border border-gray-100 shadow-sm flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 bg-white/10 border-t border-gray-100 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the vibe you're looking for..."
            className="w-full pl-6 pr-16 py-5 bg-white rounded-full border border-gray-100 focus:border-black transition-all outline-none text-sm shadow-inner"
          />
          <button 
            type="submit"
            className="absolute right-2 top-2 bottom-2 px-6 bg-black text-white rounded-full text-xs font-bold tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            disabled={!input.trim() || isTyping}
          >
            SEND
          </button>
        </form>
        <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-4">
          Powered by AURA Intelligence
        </p>
      </div>
    </div>
  );
}
