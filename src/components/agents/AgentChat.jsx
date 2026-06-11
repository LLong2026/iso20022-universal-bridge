import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { Send, Loader2 } from 'lucide-react';

export default function AgentChat({ agent }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // Create a new conversation when agent changes
  useEffect(() => {
    setMessages([]);
    setConversation(null);
    setInput('');
    const init = async () => {
      const conv = await base44.agents.createConversation({
        agent_name: agent.id,
        metadata: { name: `${agent.label} Session` }
      });
      setConversation(conv);
    };
    init();
  }, [agent.id]);

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!conversation?.id) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return unsub;
  }, [conversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || !conversation || sending) return;
    setSending(true);
    const text = input.trim();
    setInput('');
    await base44.agents.addMessage(conversation, { role: 'user', content: text });
    setSending(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="text-center text-gray-600 text-xs mt-8 font-mono tracking-widest">
            {conversation ? `— ${agent.label} ONLINE — ASK ANYTHING —` : 'INITIALIZING...'}
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm font-mono
              ${msg.role === 'user'
                ? 'bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37]'
                : 'bg-[#111] border border-gray-800 text-gray-300'}`}>
              {msg.role === 'user' ? (
                <p>{msg.content}</p>
              ) : (
                <ReactMarkdown className="prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  {msg.content || '▊'}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 p-3 flex gap-2 shrink-0">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={`Query ${agent.label}...`}
          rows={2}
          className="flex-1 bg-[#0a0a0a] border border-gray-800 rounded px-3 py-2 text-xs text-gray-300
            font-mono placeholder-gray-700 resize-none focus:outline-none focus:border-[#d4af37]/40"
        />
        <button onClick={send} disabled={sending || !conversation}
          className="px-3 py-2 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded text-[#d4af37]
            hover:bg-[#d4af37]/20 transition-colors disabled:opacity-30">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}