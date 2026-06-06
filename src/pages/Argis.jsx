import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import ArgisHeader from '@/components/argis/ArgisHeader';
import ArgisFleet from '@/components/argis/ArgisFleet';
import ArgisCommandCenter from '@/components/argis/ArgisCommandCenter';
import ArgisNodeGrid from '@/components/argis/ArgisNodeGrid';
import ArgisSelfOptimizer from '@/components/argis/ArgisSelfOptimizer';
import ArgisTaskDispatcher from '@/components/argis/ArgisTaskDispatcher';
import ArgisKnowledgeMatrix from '@/components/argis/ArgisKnowledgeMatrix';
import ArgisSystemConsole from '@/components/argis/ArgisSystemConsole';

export const ARGIS_AGENTS = [
  // TIER 1 — MASTER
  { id: 'argis-master',      name: 'ARGIS',                    role: 'Master Orchestrator',          domain: 'Omni-Domain Command',        model: 'gpt-4o',       tier: 1, color: '#a855f7', type: 'master' },
  // TIER 2 — ORCHESTRATORS
  { id: 'task-dispatcher',   name: 'DISPATCHER',               role: 'AI Task Routing Engine',       domain: 'Intelligent Task Routing',   model: 'gpt-4o',       tier: 2, color: '#818cf8', type: 'dispatcher' },
  { id: 'node-scaler',       name: 'NODE SCALER',              role: 'Predictive Scaling AI',        domain: 'Infrastructure Scaling',     model: 'gpt-4o',       tier: 2, color: '#fb7185', type: 'scaler' },
  { id: 'knowledge-master',  name: 'KNOWLEDGE MASTER',         role: 'Domain Knowledge Synthesizer', domain: 'All-Domain Knowledge Fleet', model: 'gpt-4o',       tier: 2, color: '#f59e0b', type: 'orchestrator' },
  // TIER 3 — DOMAIN AGENTS
  { id: 'finance-agent',     name: 'FINANCE AGENT',            role: 'Financial Intelligence',       domain: 'Markets, Risk, Treasury',    model: 'gpt-4o',       tier: 3, color: '#34d399', type: 'domain' },
  { id: 'legal-agent',       name: 'LEGAL AGENT',              role: 'Regulatory & Compliance AI',   domain: 'Law, Contracts, Compliance', model: 'gpt-4o',       tier: 3, color: '#60a5fa', type: 'domain' },
  { id: 'science-agent',     name: 'SCIENCE AGENT',            role: 'Scientific Research AI',       domain: 'Physics, Bio, Chemistry',    model: 'gpt-4o',       tier: 3, color: '#c084fc', type: 'domain' },
  { id: 'medical-agent',     name: 'MEDICAL AGENT',            role: 'Clinical Intelligence AI',     domain: 'Medicine, Diagnostics',      model: 'gpt-4o',       tier: 3, color: '#f43f5e', type: 'domain' },
  { id: 'engineering-agent', name: 'ENGINEERING AGENT',        role: 'Systems Engineering AI',       domain: 'Hardware, Software, Infra',  model: 'gpt-4o',       tier: 3, color: '#22d3ee', type: 'domain' },
  { id: 'security-agent',    name: 'SECURITY AGENT',           role: 'Cybersecurity Intelligence',   domain: 'Threat Detection, Hardening',model: 'gpt-4o',       tier: 3, color: '#ef4444', type: 'domain' },
  { id: 'data-agent',        name: 'DATA AGENT',               role: 'Data Science & Analytics AI',  domain: 'ML, Stats, Data Pipelines',  model: 'gpt-4o',       tier: 3, color: '#0ea5e9', type: 'domain' },
  { id: 'strategy-agent',    name: 'STRATEGY AGENT',           role: 'Strategic Planning AI',        domain: 'Decision Intelligence',      model: 'gpt-4o',       tier: 3, color: '#d97706', type: 'domain' },
  // TIER 4 — MICRO AGENTS
  { id: 'iso-agent',         name: 'ISO 20022',                role: 'Payment Compliance',           domain: 'ISO Standards & Payments',   model: 'gpt-4o-mini',  tier: 4, color: '#86efac', type: 'micro' },
  { id: 'audit-agent',       name: 'AUDIT AGENT',              role: 'Ledger Audit & Integrity',     domain: 'Solvency, Compliance Audit', model: 'gpt-4o-mini',  tier: 4, color: '#4ade80', type: 'micro' },
  { id: 'risk-agent',        name: 'RISK AGENT',               role: 'Threat & Risk Analysis',       domain: 'Risk Scoring, Alerts',       model: 'gpt-4o-mini',  tier: 4, color: '#fbbf24', type: 'micro' },
  { id: 'nlp-agent',         name: 'NLP AGENT',                role: 'Language Processing',          domain: 'Text, Sentiment, NER',       model: 'gpt-4o-mini',  tier: 4, color: '#a78bfa', type: 'micro' },
  { id: 'vision-agent',      name: 'VISION AGENT',             role: 'Computer Vision AI',           domain: 'Image, Object Detection',    model: 'gpt-4o-mini',  tier: 4, color: '#f472b6', type: 'micro' },
  { id: 'forecast-agent',    name: 'FORECAST AGENT',           role: 'Predictive Modeling',          domain: 'Time Series, Prediction',    model: 'gpt-4o-mini',  tier: 4, color: '#38bdf8', type: 'micro' },
  { id: 'repair-agent',      name: 'REPAIR AGENT',             role: 'Self-Healing & Recovery',      domain: 'Fault Detection, Repair',    model: 'gpt-4o-mini',  tier: 4, color: '#fb923c', type: 'micro' },
  { id: 'mint-agent',        name: 'MINT AGENT',               role: 'Asset Minting & Tokenization', domain: 'RWA Tokenization',           model: 'gpt-4o-mini',  tier: 4, color: '#d4af37', type: 'micro' },
  { id: 'transfer-agent',    name: 'TRANSFER AGENT',           role: 'Settlement & Transfer',        domain: 'XRP, Cross-chain',           model: 'gpt-4o-mini',  tier: 4, color: '#67e8f9', type: 'micro' },
  { id: 'ledger-agent',      name: 'LEDGER AGENT',             role: 'Transaction Integrity',        domain: 'Chain Verification',         model: 'gpt-4o-mini',  tier: 4, color: '#93c5fd', type: 'micro' },
  { id: 'synthesis-agent',   name: 'SYNTHESIS AGENT',          role: 'Cross-Domain Synthesis',       domain: 'Multi-source Synthesis',     model: 'gpt-4o-mini',  tier: 4, color: '#d8b4fe', type: 'micro' },
  { id: 'monitor-agent',     name: 'MONITOR AGENT',            role: 'System Health Monitoring',     domain: 'Metrics, Telemetry, Alerts', model: 'gpt-4o-mini',  tier: 4, color: '#6ee7b7', type: 'monitor' },
];

const EVENT_TEMPLATES = [
  (a) => ({ type: 'DISPATCH', msg: `Task routed to ${a.name} [${a.domain}] — priority: ${['CRITICAL','HIGH','MEDIUM','LOW'][Math.floor(Math.random()*4)]}` }),
  (a) => ({ type: 'METRIC',   msg: `${a.name} — SR: ${(94+Math.random()*6).toFixed(1)}% | lat: ${(10+Math.random()*90).toFixed(0)}ms | cost: $${(0.001+Math.random()*0.009).toFixed(4)}` }),
  (a) => ({ type: 'OPT',      msg: `Self-opt proposal [${a.role}]: refine ${['prompt clarity','model config','routing weight','cost efficiency'][Math.floor(Math.random()*4)]}` }),
  (a) => ({ type: 'SCALE',    msg: `NODE SCALER: cluster load ${(40+Math.random()*50).toFixed(0)}% — ${Math.random()>0.7?'SCALE UP triggered':'holding baseline'}` }),
  (a) => ({ type: 'KNOWLEDGE',msg: `KNOWLEDGE MASTER: ${a.domain} index refreshed — ${(200+Math.random()*800).toFixed(0)} vectors updated` }),
  (a) => ({ type: 'HEALTH',   msg: `MONITOR: node mesh NOMINAL | active agents: ${(Math.random()*24+1).toFixed(0)} | queue depth: ${(Math.random()*50).toFixed(0)}` }),
  (a) => ({ type: 'REROUTE',  msg: `DISPATCHER: rerouting task from overloaded ${a.name} → best-fit agent selected in ${(Math.random()*5).toFixed(1)}ms` }),
  (a) => ({ type: 'AUDIT',    msg: `AUDIT AGENT: ${a.domain} compliance check PASSED — solvency NOMINAL` }),
  (a) => ({ type: 'SETTLE',   msg: `TRANSFER AGENT: settlement confirmed ${(10+Math.random()*90).toFixed(0)}ms — ledger hash anchored` }),
  (a) => ({ type: 'SYNTH',    msg: `SYNTHESIS AGENT: cross-domain insights generated from ${(2+Math.floor(Math.random()*6))} knowledge domains` }),
];

const OPT_DESCRIPTIONS = [
  'Improve response latency by switching inference batch size',
  'Reduce cost-per-task via model downgrade on low-complexity inputs',
  'Refine system prompt with domain-specific instruction anchoring',
  'Adjust routing weight based on 7-day performance regression',
  'Enable parallel sub-agent fan-out for complex synthesis tasks',
  'Implement adaptive temperature scaling for generative tasks',
  'Cache frequent knowledge-base lookups to cut retrieval latency',
  'Add fallback agent chain for fault-tolerant task completion',
];

export default function Argis() {
  const [tab, setTab] = useState('command');
  const [running, setRunning] = useState(true);
  const [agentStates, setAgentStates] = useState(() =>
    Object.fromEntries(ARGIS_AGENTS.map(a => [a.id, {
      status: 'idle', load: Math.floor(Math.random()*30), tasks: 0,
      successRate: +(95+Math.random()*5).toFixed(1), latency: +(20+Math.random()*60).toFixed(0),
      costPerTask: +(0.002+Math.random()*0.008).toFixed(4), lastAction: null
    }]))
  );
  const [feed, setFeed] = useState([
    { id: 1, time: new Date(), type: 'INIT',    agent: 'ARGIS MASTER', message: 'ARGIS Orchestration Kernel v4.0 initialised. 24 agents standing by.' },
    { id: 2, time: new Date(), type: 'BOOT',    agent: 'DISPATCHER',   message: 'AI Task Routing Engine online. Domain index loaded: 24 agents, 8 nodes.' },
    { id: 3, time: new Date(), type: 'BOOT',    agent: 'NODE SCALER',  message: 'Predictive Scaling AI active. Baseline cluster: 8 nodes provisioned.' },
    { id: 4, time: new Date(), type: 'KNOWLEDGE',agent: 'KNOWLEDGE MASTER', message: 'Domain knowledge fleet indexed. All-domain vector store: READY.' },
  ]);
  const [optimizations, setOptimizations] = useState([]);
  const [nodes, setNodes] = useState(Array.from({length: 8}, (_, i) => ({
    id: `node-${String(i+1).padStart(3,'0')}`,
    name: `NODE-${String(i+1).padStart(3,'0')}`,
    region: ['US-EAST','US-WEST','EU-WEST','APAC','SA-EAST','AU-EAST','CA-CENTRAL','AF-SOUTH'][i],
    status: i < 6 ? 'online' : 'provisioning',
    cpu: +(20+Math.random()*50).toFixed(0), ram: +(15+Math.random()*60).toFixed(0),
    gpu: +(10+Math.random()*40).toFixed(0), activeAgents: Math.floor(Math.random()*4)+1,
    maxAgents: 6, queueDepth: Math.floor(Math.random()*12),
    tasksProcessed: Math.floor(Math.random()*5000),
    uptime: +(Math.random()*720).toFixed(1),
    costPerHour: +(0.5+Math.random()*2).toFixed(2),
    predictedLoad1h: +(20+Math.random()*60).toFixed(0),
  })));
  const [taskQueue, setTaskQueue] = useState([]);
  const tickRef = useRef(0);

  const addFeed = useCallback((type, agentName, message) => {
    setFeed(prev => [...prev.slice(-120), {
      id: Date.now() + Math.random(), time: new Date(), type, agent: agentName, message
    }]);
  }, []);

  // Master simulation loop
  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => {
      tickRef.current++;
      const agent = ARGIS_AGENTS[Math.floor(Math.random() * ARGIS_AGENTS.length)];
      const evFn = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
      const ev = evFn(agent);
      addFeed(ev.type, agent.name, ev.msg);

      // Update agent state
      setAgentStates(prev => {
        const cur = prev[agent.id] || {};
        const load = Math.min(100, Math.max(0, (cur.load || 0) + (Math.random()-0.45)*18));
        return {
          ...prev,
          [agent.id]: {
            ...cur,
            load: Math.round(load),
            status: load>85 ? 'overloaded' : load>15 ? 'active' : 'idle',
            tasks: (cur.tasks||0) + (Math.random()>0.4 ? 1 : 0),
            successRate: +(94+Math.random()*6).toFixed(1),
            latency: +(10+Math.random()*100).toFixed(0),
            costPerTask: +(0.001+Math.random()*0.012).toFixed(4),
            lastAction: ev.msg.substring(0, 48),
          }
        };
      });

      // Node fluctuation
      setNodes(prev => prev.map(n => ({
        ...n,
        cpu: Math.min(99, Math.max(5, n.cpu + (Math.random()-0.5)*10)),
        ram: Math.min(99, Math.max(5, n.ram + (Math.random()-0.5)*8)),
        gpu: Math.min(99, Math.max(0, n.gpu + (Math.random()-0.5)*12)),
        queueDepth: Math.max(0, n.queueDepth + (Math.random()>0.5?1:-1)),
        tasksProcessed: n.tasksProcessed + (Math.random()>0.6?1:0),
        predictedLoad1h: Math.min(99, Math.max(5, n.predictedLoad1h + (Math.random()-0.5)*8)),
      })));

      // Inject task into queue
      if (Math.random() < 0.3) {
        const taskTypes = ['analysis','generation','routing','optimization','audit','forecast','synthesis','repair','classification'];
        setTaskQueue(prev => [...prev.slice(-15), {
          id: `TK-${Date.now().toString(36).toUpperCase()}`,
          type: taskTypes[Math.floor(Math.random()*taskTypes.length)],
          priority: ['critical','high','medium','low'][Math.floor(Math.random()*4)],
          agent: ARGIS_AGENTS[Math.floor(Math.random()*ARGIS_AGENTS.length)].name,
          status: ['queued','dispatched','in_progress','completed'][Math.floor(Math.random()*4)],
          ts: new Date(),
        }]);
      }

      // Optimization proposals
      if (Math.random() < 0.12) {
        setOptimizations(prev => [...prev.slice(-18), {
          id: Date.now(),
          agent: agent.name, agentId: agent.id, agentColor: agent.color,
          type: ['prompt','model','routing','cost','capability'][Math.floor(Math.random()*5)],
          description: OPT_DESCRIPTIONS[Math.floor(Math.random()*OPT_DESCRIPTIONS.length)],
          scoreDelta: +(Math.random()*12).toFixed(1),
          status: 'proposed',
          proposedAt: new Date(),
        }]);
      }

      // Occasional scale event
      if (tickRef.current % 20 === 0) {
        const avgCpu = nodes.reduce((s,n)=>s+n.cpu,0) / nodes.length;
        if (avgCpu > 70) {
          addFeed('SCALE', 'NODE SCALER', `AUTO-SCALE TRIGGERED: avg CPU ${avgCpu.toFixed(0)}% → provisioning additional node`);
          setNodes(prev => [...prev, {
            id: `node-${String(prev.length+1).padStart(3,'0')}`,
            name: `NODE-${String(prev.length+1).padStart(3,'0')}`,
            region: ['US-EAST','EU-WEST','APAC'][Math.floor(Math.random()*3)],
            status: 'provisioning',
            cpu: 5, ram: 8, gpu: 0, activeAgents: 0, maxAgents: 6,
            queueDepth: 0, tasksProcessed: 0, uptime: 0, costPerHour: +(0.5+Math.random()*2).toFixed(2),
            predictedLoad1h: 40,
          }]);
        }
      }
    }, 1600);
    return () => clearInterval(iv);
  }, [running, addFeed]);

  const approveOpt = (id) => {
    setOptimizations(prev => prev.map(o => o.id===id ? {...o, status:'approved'} : o));
    const opt = optimizations.find(o=>o.id===id);
    if (opt) addFeed('OPT','ARGIS MASTER',`✓ APPROVED: ${opt.description} for ${opt.agent}`);
  };
  const rejectOpt = (id) => setOptimizations(prev => prev.map(o => o.id===id ? {...o, status:'rejected'} : o));

  const TABS = [
    { id: 'command',    label: 'COMMAND' },
    { id: 'fleet',      label: 'FLEET' },
    { id: 'nodes',      label: 'NODES' },
    { id: 'dispatcher', label: 'DISPATCHER' },
    { id: 'optimizer',  label: 'OPTIMIZER' },
    { id: 'knowledge',  label: 'KNOWLEDGE' },
    { id: 'console',    label: 'CONSOLE' },
  ];

  return (
    <div className="h-screen bg-[#02020f] text-gray-100 font-mono flex flex-col overflow-hidden">
      <ArgisHeader running={running} onToggle={() => setRunning(r=>!r)} agentCount={ARGIS_AGENTS.length} nodeCount={nodes.length} />

      {/* Tab Bar */}
      <div className="flex border-b border-purple-900/30 bg-[#05051a] shrink-0 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-2 text-[10px] tracking-widest font-bold uppercase whitespace-nowrap transition-colors border-b-2 ${
              tab===t.id ? 'border-purple-500 text-purple-300 bg-purple-900/10' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === 'command'    && <ArgisCommandCenter agents={ARGIS_AGENTS} agentStates={agentStates} feed={feed} taskQueue={taskQueue} />}
        {tab === 'fleet'      && <ArgisFleet agents={ARGIS_AGENTS} agentStates={agentStates} />}
        {tab === 'nodes'      && <ArgisNodeGrid nodes={nodes} />}
        {tab === 'dispatcher' && <ArgisTaskDispatcher taskQueue={taskQueue} agents={ARGIS_AGENTS} agentStates={agentStates} addFeed={addFeed} />}
        {tab === 'optimizer'  && <ArgisSelfOptimizer optimizations={optimizations} onApprove={approveOpt} onReject={rejectOpt} agents={ARGIS_AGENTS} />}
        {tab === 'knowledge'  && <ArgisKnowledgeMatrix agents={ARGIS_AGENTS} agentStates={agentStates} />}
        {tab === 'console'    && <ArgisSystemConsole feed={feed} running={running} />}
      </div>
    </div>
  );
}