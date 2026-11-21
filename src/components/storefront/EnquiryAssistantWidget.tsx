import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Phone, ExternalLink } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { runEnquiryAgent } from '../../utils/agentAutomation';
import { buildWhatsAppUrl } from '../../utils/whatsapp';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  matchedTopics?: string[];
  suggestedForumThreadSlug?: string;
  timestamp: string;
}

const QUICK_SUGGESTIONS = [
  'Can I request a refund if I am not satisfied?',
  'How do I receive my verified course certificate?',
  'How do I pay via GTB Transfer or Paystack?',
  'What is included in the CourseMart Pro Membership?',
];

export function EnquiryAssistantWidget() {
  const { navigate } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hi there! I am CourseMart’s AI Enquiry Assistant. How can I help you today with courses, payment options, certificates, or community discussions?',
      timestamp: 'Just now',
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleAsk = (query: string) => {
    const text = query.trim();
    if (!text) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsTyping(true);

    setTimeout(() => {
      const res = runEnquiryAgent(text);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        matchedTopics: res.matchedTopics,
        suggestedForumThreadSlug: res.suggestedForumThreadSlug,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAsk(inputQuestion);
  };

  const whatsappEscalationUrl = buildWhatsAppUrl(
    'Hello CourseMart Support, I need human assistance with my enquiry.'
  );

  return (
    <aside aria-label="Customer Enquiry Assistant">
      {/* Collapsed Launcher Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open CourseMart AI Enquiry Assistant"
          className="fixed bottom-6 right-6 z-40 h-12 px-4 rounded-full bg-[#0a192f] text-white shadow-2xl border border-slate-700 flex items-center gap-2.5 hover:scale-105 transition-all duration-200 cursor-pointer group"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-indigo-300 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          <span className="text-xs font-bold tracking-wide">Ask Assistant</span>
        </button>
      )}

      {/* Expanded Chat Dialog */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-40 w-[360px] sm:w-[390px] h-[520px] max-h-[82vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 bg-[#0a192f] text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-300">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold leading-tight">CourseMart Assistant</h3>
                <p className="text-[11px] text-slate-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  Instant Automated Support
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close Assistant"
              className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#0a192f] text-white rounded-br-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p>{m.text}</p>
                  {m.matchedTopics && m.matchedTopics.length > 0 && (
                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex flex-wrap gap-1">
                      {m.matchedTopics.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {m.suggestedForumThreadSlug && (
                    <button
                      type="button"
                      onClick={() => {
                        navigate(`/community/thread/${m.suggestedForumThreadSlug}`);
                        setIsOpen(false);
                      }}
                      className="mt-2 text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View community discussion
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-white border border-slate-200 rounded-2xl rounded-bl-none px-3 py-2 w-20">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            )}

            {/* Quick Suggestion Chips */}
            {messages.length === 1 && (
              <div className="pt-2 space-y-1.5">
                <p className="text-[11px] font-bold text-slate-400">Frequently Asked Questions:</p>
                {QUICK_SUGGESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleAsk(q)}
                    className="w-full text-left text-xs bg-white hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-200 text-slate-700 p-2 rounded-lg transition-colors cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* WhatsApp Escalation Bar */}
          <div className="px-3 py-1.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
            <span>Need human support?</span>
            <a
              href={whatsappEscalationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <Phone className="w-3 h-3" />
              Chat on WhatsApp
            </a>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-200 flex gap-2">
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder="Type your question..."
              className="flex-1 h-9 px-3 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
            />
            <button
              type="submit"
              disabled={!inputQuestion.trim() || isTyping}
              aria-label="Send question"
              className="w-9 h-9 flex items-center justify-center bg-[#0a192f] text-white rounded-md hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}
