import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Trash2, Filter } from 'lucide-react';

const TYPE_COLORS = {
  INIT: '#a855f7', BOOT: '#818cf8', DISPATCH: '#22d3ee', METRIC: '#4ade80',
  OPT: '#f59e0b', SCALE: '#fb7185', KNOWLEDGE: '#d4af37', HEALTH: '#6ee7b7',
  REROUTE: '#f97316', AUDIT: '#34d399', SETTLE: '#60a5fa', SYNTH: '#c084fc',
  INFO: '#9ca3af', WARN: '#fbbf24', ERROR: '#ef4444',
};

export default function ArgisSystemConsole({ feed, running }) {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const consoleRef = useRef(null);

  const filters = ['ALL', 'DISPATCH', 'METRIC', 'OPT', 'SCALE', 'KNOWLEDGE', 'HEALTH', 'AUDIT'];

  const filtered = feed.filter(e => {
    const typeMatch = filter === 'ALL' || e.type === filter;
    const searchMatch = !search || e.message.toLowerCase().includes(search.toLowerCase()) || e.agent.toLowerCase().includes(search.toLowerCase());
    return typeMatch && searchMatch;
  });

  useEffect(() => {
    if (autoScroll && consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [filtered, autoScroll]);

  const exportLogs = () => {
    const text = filtered.map(e => `[${e.time.toISOString()}] [${e.type}] ${e.agent}: ${e.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `argis-console-${Date.now()}.log`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-[#02020f] overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-[#1a1a2e] px-4 py-2 flex items-center gap-3 shrink-0">
        <div className="flex gap-1 overflow-x-auto">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-2 py-0.5 text-[8px] border rounded tracking-wider whitespace-nowrap transition-colors ${
                filter===f ? 'border-purple-500/60 text-purple-300 bg-purple-900/20' : 'border-[#222] text-gray-600 hover:text-gray-400'
              }`}
              style={filter===f && TYPE_COLORS[f] ? { borderColor: TYPE_COLORS[f]+'88', color: TYPE_COLORS[f] } : {}}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex-1 flex items-center gap-2">
          <Filter className="w-3 h-3 text-gray-600" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search events..."
            className="flex-1 bg-black border border-[#222] rounded px-2 py-0.5 text-[9px] text-gray-400 focus:outline-none focus:border-purple-600"
          />
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setAutoScroll(a=>!a)}
            className={`px-2 py-0.5 text-[8px] border rounded tracking-wider ${autoScroll?'border-green-700 text-green-400':'border-[#222] text-gray-600'}`}>
            AUTO-SCROLL
          </button>
          <button onClick={exportLogs}
            className="px-2 py-0.5 text-[8px] border border-[#222] rounded text-gray-600 hover:text-gray-400 flex items-center gap-1">
            <Download className="w-2.5 h-2.5" />EXPORT
          </button>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className={`w-1.5 h-1.5 rounded-full ${running ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[9px] text-gray-600">{filtered.length} EVENTS</span>
        </div>
      </div>

      {/* Console output */}
      <div ref={consoleRef} className="flex-1 overflow-y-auto p-3 font-mono" onScroll={(e) => {
        const el = e.target;
        const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50;
        setAutoScroll(atBottom);
      }}>
        {filtered.map((e, i) => (
          <motion.div key={e.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-start gap-2 py-0.5 hover:bg-white/[0.02] rounded px-1 group">
            <span className="text-gray-700 text-[9px] shrink-0 w-20">
              {e.time.toISOString().slice(11,23)}
            </span>
            <span className="text-[8px] font-bold w-16 shrink-0 uppercase"
              style={{ color: TYPE_COLORS[e.type]||'#6b7280' }}>
              [{e.type}]
            </span>
            <span className="text-purple-400/70 text-[9px] shrink-0 w-32 truncate">{e.agent}</span>
            <span className="text-green-300/80 text-[9px] flex-1 leading-relaxed">{e.message}</span>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="text-[10px] text-gray-700 text-center py-8">NO EVENTS MATCHING FILTER</div>
        )}
      </div>

      {/* Status bar */}
      <div className="border-t border-[#1a1a2e] px-4 py-1 flex items-center justify-between shrink-0">
        <span className="text-[8px] text-gray-700">
          ARGIS SYSTEM CONSOLE v4.0 · {running ? 'LIVE' : 'PAUSED'} · {filtered.length}/{feed.length} events
        </span>
        <span className="text-[8px] text-gray-700">FILTER: {filter} · SEARCH: {search || 'none'}</span>
      </div>
    </div>
  );
}