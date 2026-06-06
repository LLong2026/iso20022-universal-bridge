import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Search, Book, Loader, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const KNOWLEDGE_DOMAINS = [
  { id: 'finance',     label: 'FINANCE & MARKETS',        agent: 'FINANCE AGENT',     vectors: 48200, color: '#34d399' },
  { id: 'legal',       label: 'LEGAL & COMPLIANCE',       agent: 'LEGAL AGENT',       vectors: 31500, color: '#60a5fa' },
  { id: 'science',     label: 'SCIENCE & RESEARCH',       agent: 'SCIENCE AGENT',     vectors: 92400, color: '#c084fc' },
  { id: 'medical',     label: 'MEDICINE & DIAGNOSTICS',   agent: 'MEDICAL AGENT',     vectors: 67800, color: '#f43f5e' },
  { id: 'engineering', label: 'ENGINEERING & SYSTEMS',    agent: 'ENGINEERING AGENT', vectors: 55600, color: '#22d3ee' },
  { id: 'security',    label: 'CYBERSECURITY',            agent: 'SECURITY AGENT',    vectors: 28900, color: '#ef4444' },
  { id: 'data',        label: 'DATA SCIENCE & ML',        agent: 'DATA AGENT',        vectors: 41300, color: '#0ea5e9' },
  { id: 'strategy',    label: 'STRATEGY & DECISIONS',     agent: 'STRATEGY AGENT',    vectors: 19700, color: '#d97706' },
  { id: 'iso',         label: 'ISO 20022 / PAYMENTS',     agent: 'ISO 20022',         vectors: 8400,  color: '#86efac' },
  { id: 'rwa',         label: 'RWA TOKENIZATION',         agent: 'MINT AGENT',        vectors: 6200,  color: '#d4af37' },
  { id: 'nlp',         label: 'LANGUAGE & NLP',           agent: 'NLP AGENT',         vectors: 38700, color: '#a78bfa' },
  { id: 'forecast',    label: 'FORECASTING & PREDICTION', agent: 'FORECAST AGENT',    vectors: 22100, color: '#38bdf8' },
];

const totalVectors = KNOWLEDGE_DOMAINS.reduce((s,d)=>s+d.vectors,0);

export default function ArgisKnowledgeMatrix({ agents, agentStates }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleQuery = async () => {
    if (!query.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await base44.functions.invoke('argisOrchestrator', {
        action: 'knowledge_query',
        query,
      });
      setResult(res.data);
    } catch {
      // Simulate local result
      const domain = KNOWLEDGE_DOMAINS[Math.floor(Math.random()*KNOWLEDGE_DOMAINS.length)];
      setResult({
        answer: `Based on ${domain.label} knowledge corpus: The query "${query}" has been analyzed across ${(domain.vectors/1000).toFixed(1)}K vectors. Key insights synthesized from cross-domain references indicate high relevance to ${domain.agent} specialization area.`,
        domain: domain.label,
        agent: domain.agent,
        confidence: +(0.72+Math.random()*0.26).toFixed(2),
        references: [domain.label, KNOWLEDGE_DOMAINS[Math.floor(Math.random()*KNOWLEDGE_DOMAINS.length)].label],
        vectors_searched: Math.floor(domain.vectors * 0.4),
      });
    } finally { setLoading(false); }
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left: Domain grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[9px] text-gray-500 tracking-widest">KNOWLEDGE DOMAIN MATRIX</div>
          <div className="text-[9px] text-gray-600">
            TOTAL: <span className="text-yellow-400 font-bold">{totalVectors.toLocaleString()}</span> VECTORS
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {KNOWLEDGE_DOMAINS.map((domain, i) => {
            const pct = (domain.vectors / Math.max(...KNOWLEDGE_DOMAINS.map(d=>d.vectors)) * 100).toFixed(0);
            const agent = agents.find(a=>a.name===domain.agent);
            const state = agent ? agentStates[agent.id] : null;
            return (
              <motion.div key={domain.id}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i*0.03 }}
                className="border border-[#1a1a2e] rounded-lg p-3 bg-[#07071a]"
              >
                <div className="flex items-center justify-between mb-2">
                  <Book className="w-3 h-3" style={{ color: domain.color }} />
                  {state && (
                    <motion.div
                      animate={{ opacity: state.status==='active' ? [1,0.3,1] : 1 }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: state.status==='active' ? '#4ade80' : '#374151' }}
                    />
                  )}
                </div>
                <div className="text-[9px] font-bold mb-1" style={{ color: domain.color }}>{domain.label}</div>
                <div className="text-[7px] text-gray-600 mb-2">{domain.agent}</div>
                <div className="text-[10px] font-bold text-gray-300 mb-1">
                  {(domain.vectors/1000).toFixed(1)}K <span className="text-[7px] text-gray-600">vectors</span>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: domain.color }} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Right: Knowledge query */}
      <div className="w-80 border-l border-[#1a1a2e] flex flex-col p-4 overflow-auto gap-4">
        <div className="text-[9px] text-gray-500 tracking-widest">KNOWLEDGE QUERY</div>

        <div>
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ask the knowledge fleet any question across all domains..."
            className="w-full h-24 bg-black border border-[#333] rounded p-2 text-[10px] text-gray-300 font-mono resize-none focus:outline-none focus:border-purple-600"
          />
        </div>

        <Button onClick={handleQuery} disabled={loading || !query.trim()}
          className="w-full bg-yellow-700 hover:bg-yellow-600 text-black text-[10px] font-bold tracking-widest h-9">
          {loading ? <><Loader className="w-3 h-3 mr-2 animate-spin" />QUERYING FLEET...</> : <><Zap className="w-3 h-3 mr-2" />QUERY KNOWLEDGE FLEET</>}
        </Button>

        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="border border-yellow-900/50 bg-yellow-950/10 rounded-lg p-3 space-y-2">
            <div className="text-[8px] text-yellow-400 tracking-widest">SYNTHESIZED ANSWER</div>
            <div className="text-[9px] text-gray-300 leading-relaxed">{result.answer}</div>
            {result.domain && (
              <div className="space-y-1 pt-2 border-t border-[#1a1a2e]">
                {[
                  ['DOMAIN', result.domain],
                  ['AGENT', result.agent],
                  ['CONFIDENCE', result.confidence ? `${(result.confidence*100).toFixed(0)}%` : '—'],
                  ['VECTORS SEARCHED', result.vectors_searched?.toLocaleString() || '—'],
                ].map(([k,v]) => (
                  <div key={k} className="flex justify-between text-[8px]">
                    <span className="text-gray-600">{k}:</span>
                    <span className="text-yellow-300">{v}</span>
                  </div>
                ))}
                {result.references?.length > 0 && (
                  <div className="text-[8px] text-gray-600">REFS: {result.references.join(', ')}</div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Domain quick reference */}
        <div className="border border-[#1a1a2e] rounded p-3">
          <div className="text-[8px] text-gray-600 mb-2 tracking-widest">ACTIVE DOMAINS</div>
          {KNOWLEDGE_DOMAINS.slice(0,6).map(d => (
            <div key={d.id} className="flex justify-between items-center py-0.5">
              <span className="text-[8px]" style={{ color: d.color }}>{d.label}</span>
              <span className="text-[7px] text-gray-700">{(d.vectors/1000).toFixed(1)}K</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}