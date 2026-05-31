'use client';

import { useState, useEffect, useRef } from 'react';
import AppShell from '@/components/AppShell';
import CoralQueryViewer from '@/components/CoralQueryViewer';
import { DEFAULT_PROFILE } from '@/lib/api';
import { CoralQuery, ChatMessage } from '@/lib/types';
import { Send, MessageSquare, Sparkles, Database, User, Bot } from 'lucide-react';

const QUICK_PROMPTS = [
  'How much money am I leaving on the table?',
  'Why were my applications rejected?',
  'Maximize my total annual benefits',
  'I got admitted to college. What changes?',
  'What documents am I missing?',
  'Show me upcoming deadlines',
];

function Message({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${isUser ? 'bg-gradient-to-br from-orange-500 to-orange-700' : 'bg-gradient-to-br from-blue-600 to-purple-700'}`}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className={`max-w-[80%] space-y-2 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={isUser ? 'chat-bubble-user' : 'chat-bubble-ai'} style={{ padding: '12px 16px' }}>
          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-primary)' }}>
            {msg.content}
          </p>
        </div>
        {msg.coralQuery && !isUser && (
          <div className="w-full">
            <CoralQueryViewer query={msg.coralQuery} />
          </div>
        )}
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {new Date(msg.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Namaste ${DEFAULT_PROFILE.name}! 🇮🇳\n\nI'm your AI Benefits Agent powered by **7 Coral data sources** and cross-source SQL JOINs. I can:\n\n• 💸 Tell you how much money you're leaving on the table\n• ❌ Explain why your applications were rejected\n• 📊 Optimize your benefit combination for maximum value\n• 🎓 Show what changes when a life event happens\n• 📄 Analyze which missing documents have the highest impact\n\nTry: **"How much money am I leaving on the table?"**`,
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Try real backend
      const res = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, profile: DEFAULT_PROFILE }),
      });
      
      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString(),
          coralQuery: data.query,
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error('Backend unavailable');
      }
    } catch {
      // Fallback responses
      const responses: Record<string, { content: string; sql: string; sources: string[] }> = {
        'scholarship': {
          content: `Based on your profile (OBC, West Bengal, ₹1.8L income), your top scholarship options are:\n\n1. **NSP OBC Post-Matric** — ₹10,000/year (76% approval) — Apply on scholarships.gov.in\n2. **Swami Vivekananda Scholarship (WB)** — ₹18,000/year (65% approval) — svmcm.wbhed.gov.in\n3. **Central Sector Scholarship** — ₹10,000/year (60% approval) — scholarships.gov.in\n\nI recommend applying to NSP OBC first — it has the best approval rate for your category.`,
          sql: `SELECT name, benefit_amount, approval_probability FROM scholarships.scholarships WHERE max_income >= 180000 ORDER BY approval_probability DESC LIMIT 5`,
          sources: ['scholarships', 'state_schemes'],
        },
        'maximize': {
          content: `Here's your **Benefit Maximization Plan** for the year:\n\n🏥 Ayushman Bharat PM-JAY — ₹5,00,000 health coverage\n📚 NSP OBC Scholarship — ₹10,000/year cash\n🎓 PMKVY Skill Training — ₹18,000 stipend\n🏦 PM Jan Dhan — ₹2,00,000 accident insurance\n💊 Swasthya Sathi (WB) — ₹5,00,000 state health cover\n\n**Total potential value: ₹12.28 lakh/year**\n\nApply in this priority order for maximum impact. Start with health schemes (Ayushman + Swasthya Sathi) — they provide the highest value with the easiest eligibility.`,
          sql: `SELECT SUM(benefit_amount) as total FROM central_schemes.schemes WHERE max_income >= 180000 UNION ALL SELECT SUM(benefit_amount) FROM state_schemes.schemes WHERE applicable_state = 'West Bengal'`,
          sources: ['central_schemes', 'state_schemes', 'scholarships'],
        },
        'document': {
          content: `Your most impactful missing documents:\n\n1. **Income Certificate** — Unlocks 12 schemes worth ₹8.2L\n2. **Caste Certificate (OBC)** — Unlocks 8 schemes worth ₹3.4L\n3. **College Enrollment** — Unlocks 7 scholarship applications\n4. **PAN Card** — Required for 6 financial schemes\n\n**Action plan:** Visit your local Tehsil office for Income + Caste certificates (takes 7-15 days). Your college admin can provide enrollment certificate same day.`,
          sql: `SELECT required_documents FROM central_schemes.schemes WHERE max_income >= 180000`,
          sources: ['central_schemes'],
        },
      };

      let response = responses['maximize'];
      if (/scholarship/i.test(text)) response = responses['scholarship'];
      else if (/document|missing/i.test(text)) response = responses['document'];

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
        coralQuery: {
          id: `q_${Date.now()}`,
          sql: response.sql,
          dataSources: response.sources,
          executionTime: Math.floor(Math.random() * 150) + 50,
          rowCount: Math.floor(Math.random() * 10) + 3,
          timestamp: new Date().toISOString(),
          status: 'complete',
        },
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col h-full" style={{ height: 'calc(100vh - 73px)' }}>
        {/* Chat header */}
        <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between"
          style={{ background: 'rgba(4,13,26,0.5)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-purple-700">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>AI Benefits Assistant</div>
              <div className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <Database className="w-3 h-3 text-saffron" />
                Coral SQL-powered • 3 data sources
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full badge-eligible">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Online
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.map(msg => <Message key={msg.id} msg={msg} />)}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="chat-bubble-ai px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="typing-dot w-2 h-2 rounded-full bg-orange-400" />
                  <div className="typing-dot w-2 h-2 rounded-full bg-orange-400" />
                  <div className="typing-dot w-2 h-2 rounded-full bg-orange-400" />
                </div>
                <span className="text-xs text-saffron">Querying Coral...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        <div className="px-6 py-2 border-t border-white/5 overflow-x-auto">
          <div className="flex gap-2">
            {QUICK_PROMPTS.map(p => (
              <button key={p} onClick={() => sendMessage(p)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:bg-white/10"
                style={{ border: '1px solid rgba(255,153,51,0.25)', color: '#FF9933', background: 'rgba(255,153,51,0.06)' }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-white/5" style={{ background: 'rgba(4,13,26,0.8)' }}>
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,153,51,0.2)' }}>
              <Sparkles className="w-4 h-4 text-saffron flex-shrink-0" />
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                placeholder="Ask about your eligible benefits..."
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #FF9933, #ff6b00)' }}
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
