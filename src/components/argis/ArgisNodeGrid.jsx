import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Server, Cpu, Database, Zap, Activity, TrendingUp, AlertTriangle } from 'lucide-react';

function GaugeBar({ label, value, color }) {
  const pct = Math.min(100, Math.max(0, value));
  const bar = pct > 80 ? '#ef4444' : pct > 60 ? '#f97316' : color;
  return (
    <div>
      <div className="flex justify-between text-[8px] text-gray-600 mb-0.5">
        <span>{label}</span><span style={{ color: bar }}>{pct.toFixed(0)}%</span>
      </div>
      <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }}
          className="h-full rounded-full" style={{ backgroundColor: bar }} />
      </div>
    </div>
  );
}

const STATUS_COLORS = {
  online: { dot: '#4ade80', bg: 'bg-green-900/20 border-green-900/50', text: 'text-green-400' },
  provisioning: { dot: '#f59e0b', bg: 'bg-yellow-900/20 border-yellow-900/50', text: 'text-yellow-400' },
  draining: { dot: '#f97316', bg: 'bg-orange-900/20 border-orange-900/50', text: 'text-orange-400' },
  offline: { dot: '#6b7280', bg: 'bg-gray-900/20 border-gray-800', text: 'text-gray-500' },
};

export default function ArgisNodeGrid({ nodes }) {
  const [selectedNode, setSelectedNode] = useState(null);

  const totalNodes = nodes.length;
  const onlineNodes = nodes.filter(n=>n.status==='online').length;
  const avgCpu = (nodes.reduce((s,n)=>s+n.cpu,0)/nodes.length).toFixed(1);
  const totalTasks = nodes.reduce((s,n)=>s+n.tasksProcessed,0);

  return (
    <div className="h-full flex flex-col overflow-hidden p-4">
      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-3 mb-4 shrink-0">
        {[
          { label: 'TOTAL NODES', val: totalNodes, color: 'text-cyan-300', icon: Server },
          { label: 'ONLINE', val: onlineNodes, color: 'text-green-400', icon: Activity },
          { label: 'AVG CPU', val: `${avgCpu}%`, color: 'text-orange-400', icon: Database },
          { label: 'TASKS PROCESSED', val: totalTasks.toLocaleString(), color: 'text-purple-300', icon: TrendingUp },
        ].map(s => (
          <div key={s.label} className="border border-[#1a1a2e] rounded-lg p-3 bg-[#07071a] flex items-center gap-3">
            <s.icon className="w-4 h-4 text-gray-600" />
            <div>
              <div className={`text-base font-bold ${s.color}`}>{s.val}</div>
              <div className="text-[8px] text-gray-600 tracking-wider">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Node grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {nodes.map((node, i) => {
            const sc = STATUS_COLORS[node.status] || STATUS_COLORS.offline;
            return (
              <motion.div key={node.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedNode(selectedNode===node.id ? null : node.id)}
                className={`border rounded-lg p-3 bg-[#07071a] cursor-pointer hover:bg-[#0d0d25] transition-all ${
                  selectedNode===node.id ? 'border-cyan-500/60 ring-1 ring-cyan-500/20' : 'border-[#1a1a2e]'
                }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <motion.div
                      animate={{ opacity: node.status==='online' ? [1,0.3,1] : 1 }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-2 h-2 rounded-full" style={{ backgroundColor: sc.dot }}
                    />
                    <span className="text-[9px] font-bold text-cyan-300">{node.name}</span>
                  </div>
                  {node.cpu > 80 && <AlertTriangle className="w-3 h-3 text-red-400" />}
                </div>

                <div className="text-[8px] text-gray-500 mb-2">{node.region}</div>

                <div className="space-y-1.5">
                  <GaugeBar label="CPU" value={node.cpu} color="#22d3ee" />
                  <GaugeBar label="RAM" value={node.ram} color="#a855f7" />
                  <GaugeBar label="GPU" value={node.gpu} color="#34d399" />
                </div>

                <div className="mt-2 grid grid-cols-2 gap-1">
                  <div className="text-center border border-[#111] rounded p-1">
                    <div className="text-[9px] font-bold text-cyan-300">{node.activeAgents}/{node.maxAgents}</div>
                    <div className="text-[7px] text-gray-700">AGENTS</div>
                  </div>
                  <div className="text-center border border-[#111] rounded p-1">
                    <div className="text-[9px] font-bold text-purple-300">{node.queueDepth}</div>
                    <div className="text-[7px] text-gray-700">QUEUE</div>
                  </div>
                </div>

                <div className={`mt-2 text-center text-[7px] px-1 py-0.5 rounded border ${sc.bg} ${sc.text}`}>
                  {node.status.toUpperCase()}
                </div>

                {/* Predicted load */}
                <div className="mt-2">
                  <div className="text-[7px] text-gray-600 mb-0.5">PRED. LOAD 1H</div>
                  <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-yellow-500/60" style={{ width: `${node.predictedLoad1h}%` }} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}