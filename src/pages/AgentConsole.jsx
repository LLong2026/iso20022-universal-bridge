import React, { useState } from 'react';
import AgentCard from '@/components/agents/AgentCard';
import AgentChat from '@/components/agents/AgentChat';
import { Bot } from 'lucide-react';

const AGENTS = [
  {
    id: 'vault_guardian',
    label: 'VAULT GUARDIAN',
    color: '#d4af37',
    description: 'Asset integrity monitor. Scans AssetRecords for encryption anomalies, unverified assets, and ownership mismatches.',
  },
  {
    id: 'ledger_auditor',
    label: 'LEDGER AUDITOR',
    color: '#60a5fa',
    description: 'Transaction chain verifier. Audits hash chain integrity, block anchoring, and detects broken or orphaned transactions.',
  },
  {
    id: 'artifact_processor',
    label: 'ARTIFACT PROCESSOR',
    color: '#34d399',
    description: 'Artifact lifecycle manager. Tracks pending → bound → archived workflows and validates binding prerequisites.',
  },
  {
    id: 'did_authority',
    label: 'DID AUTHORITY',
    color: '#a78bfa',
    description: 'DID ownership verifier. Resolves DID portfolios, detects orphaned assets, ownership conflicts, and claim disputes.',
  },
  {
    id: 'risk_sentinel',
    label: 'RISK SENTINEL',
    color: '#f87171',
    description: 'Threat detection and compliance monitor. Analyzes AuditLogs for critical events, threat patterns, and generates risk scores.',
  },
  {
    id: 'mint_controller',
    label: 'MINT CONTROLLER',
    color: '#fbbf24',
    description: 'GoldAsset minting authority. Audits mint ledger, validates UTXO allocations, and verifies binding hash integrity.',
  },
];

export default function AgentConsole() {
  const [activeAgent, setActiveAgent] = useState(AGENTS[0]);

  return (
    <div className="h-screen bg-[#050505] text-gray-100 font-mono flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-3 flex items-center gap-3 shrink-0 bg-[#080808]">
        <Bot className="w-4 h-4 text-[#d4af37]" />
        <div>
          <h1 className="text-xs font-bold tracking-[0.25em] text-[#d4af37] uppercase">
            AI Agent Console
          </h1>
          <p className="text-[9px] text-gray-600 tracking-widest">
            JASPER RWA — PRODUCTION INTEGRATION AGENTS — {AGENTS.length} ACTIVE
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[9px] text-green-500 tracking-widest">ALL AGENTS ONLINE</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Agent Roster */}
        <div className="w-56 border-r border-gray-800 overflow-y-auto shrink-0 p-3 space-y-2 bg-[#060606]">
          <div className="text-[8px] text-gray-700 tracking-widest uppercase mb-3 px-1">
            Select Agent
          </div>
          {AGENTS.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              active={activeAgent.id === agent.id}
              onClick={() => setActiveAgent(agent)}
            />
          ))}
        </div>

        {/* Chat Panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#050505]">
          {/* Agent Header */}
          <div className="border-b border-gray-800 px-4 py-2.5 flex items-center gap-3 shrink-0">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeAgent.color }} />
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: activeAgent.color }}>
              {activeAgent.label}
            </span>
            <span className="text-[9px] text-gray-600 ml-2">{activeAgent.description}</span>
          </div>
          <AgentChat agent={activeAgent} />
        </div>
      </div>
    </div>
  );
}