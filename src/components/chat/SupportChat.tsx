'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ArrowRight,
  Minimize2,
  RefreshCw
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'How does pricing work?',
  'How do review requests work?',
  'Is there a free trial?',
  'How does Gemini AI boost SEO?',
];

export default function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi there! 👋 I am your RatingPulse AI Assistant. How can I help you automate your 5-star Google reviews today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const sendMessage = async (text: string) => {
    const userText = text.trim();
    if (!userText || loading) return;

    const userMessage: Message = {
      id: String(Date.now()),
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();
      const replyContent = data.reply || 'Thanks for reaching out! You can start a 14-day free trial at https://ratingpulse.co/signup.';

      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'assistant',
          content: replyContent,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'assistant',
          content: 'Sorry, I had trouble connecting. RatingPulse is $25/mo with a 14-day free trial. You can test it at https://ratingpulse.co/signup!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 select-none">
      {/* Floating Chat Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-[#111820] hover:bg-[#161f26] text-white border border-[#22c55e]/40 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.35)] hover:shadow-[0_0_28px_rgba(34,197,94,0.55)] hover:scale-105 transition-all duration-300 cursor-pointer"
          aria-label="Open RatingPulse Support Chat"
        >
          {/* Animated Green Pulse Indicator */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#22c55e]"></span>
          </span>

          <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm tracking-tight text-white">
            <Sparkles className="w-4 h-4 text-[#22c55e]" />
            <span>Ask RatingPulse AI</span>
          </div>
        </button>
      )}

      {/* Floating Chat Dialog Window */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[380px] h-[520px] max-h-[85vh] bg-[#111820] border border-[#22c55e]/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          {/* Top Header */}
          <div className="p-3.5 bg-[#161f26] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#22c55e]/15 border border-[#22c55e]/30 flex items-center justify-center text-[#22c55e]">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  RatingPulse AI Assistant
                  <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                </h3>
                <p className="text-[10px] text-slate-400">Online • 24/7 Instant Answers</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Minimize chat"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 scroll-smooth text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-[#22c55e]/15 border border-[#22c55e]/30 flex items-center justify-center text-[#22c55e] shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-[#22c55e] to-[#14b8a6] text-slate-950 font-semibold rounded-tr-none shadow-md'
                      : 'bg-[#18222a] border border-slate-700/60 text-slate-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  {m.content}
                  <div
                    className={`text-[9px] mt-1.5 ${
                      m.role === 'user' ? 'text-slate-900/70 text-right' : 'text-slate-500 text-left'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>

                {m.role === 'user' && (
                  <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <User className="w-3 h-3" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 items-center text-slate-400 text-xs">
                <div className="w-6 h-6 rounded-lg bg-[#22c55e]/15 border border-[#22c55e]/30 flex items-center justify-center text-[#22c55e] shrink-0">
                  <Sparkles className="w-3 h-3 animate-spin" />
                </div>
                <div className="bg-[#18222a] border border-slate-700/60 p-2.5 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#14b8a6] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 py-2 bg-[#161f26]/80 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                className="shrink-0 px-2.5 py-1 rounded-full bg-[#18222a] hover:bg-slate-800 border border-slate-700/70 text-[10px] font-medium text-slate-300 hover:text-[#22c55e] hover:border-[#22c55e]/40 transition-all cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Bottom Form */}
          <div className="p-3 bg-[#161f26] border-t border-slate-800">
            <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about reviews, AI, pricing..."
                className="flex-1 px-3.5 py-2 bg-[#18222a] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] transition-all"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2 bg-gradient-to-r from-[#22c55e] to-[#14b8a6] hover:brightness-110 text-slate-950 rounded-xl transition-all shadow-md shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Send message"
              >
                <Send className="w-4 h-4 fill-slate-950" />
              </button>
            </form>

            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 px-1">
              <span>⚡ Flat $25/mo • 14-Day Free Trial</span>
              <Link
                href="/signup"
                onClick={() => setIsOpen(false)}
                className="text-[#22c55e] font-bold hover:underline flex items-center gap-0.5"
              >
                Start Free Trial →
              </Link>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
