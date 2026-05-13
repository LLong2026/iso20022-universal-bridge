import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function OrchestratorBrain({ agents, agentStates }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    const draw = () => {
      timeRef.current += 0.02;
      const t = timeRef.current;

      ctx.fillStyle = 'rgba(5,5,16,0.3)';
      ctx.fillRect(0, 0, W, H);

      // Central node
      const pulse = 0.7 + Math.sin(t * 2) * 0.3;
      ctx.beginPath();
      ctx.arc(cx, cy, 18 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(168,85,247,${0.3 * pulse})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#a855f7';
      ctx.fill();

      // Outer ring
      ctx.beginPath();
      ctx.arc(cx, cy, 30 + Math.sin(t) * 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(168,85,247,0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Agent nodes
      const nonMaster = agents.filter(a => a.id !== 'master');
      nonMaster.forEach((agent, i) => {
        const angle = (i / nonMaster.length) * Math.PI * 2 - Math.PI / 2 + t * 0.05;
        const r = 90 + Math.sin(t + i) * 4;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        const state = agentStates[agent.id] || {};
        const isActive = state.status === 'active';

        // Connection line
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.strokeStyle = isActive
          ? `rgba(${hexToRgb(agent.color)},0.5)`
          : 'rgba(50,50,80,0.3)';
        ctx.lineWidth = isActive ? 1.5 : 0.5;
        ctx.stroke();

        // Pulse along line when active
        if (isActive) {
          const progress = ((t * 0.8 + i * 0.3) % 1);
          const px = cx + (x - cx) * progress;
          const py = cy + (y - cy) * progress;
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fillStyle = agent.color;
          ctx.fill();
        }

        // Agent dot
        const nodeR = isActive ? 7 + Math.sin(t * 3 + i) * 2 : 5;
        ctx.beginPath();
        ctx.arc(x, y, nodeR, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? agent.color : '#1a1a3a';
        ctx.fill();
        ctx.strokeStyle = agent.color;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      frameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frameRef.current);
  }, [agents, agentStates]);

  const activeCount = Object.values(agentStates).filter(s => s.status === 'active').length;
  const totalLoad = Object.values(agentStates).reduce((s, a) => s + (a.load || 0), 0);
  const avgLoad = agents.length ? Math.round(totalLoad / agents.length) : 0;

  return (
    <div className="border-b border-[#1a1a2e] bg-[#06061a] p-4 shrink-0">
      <div className="text-[10px] text-gray-500 tracking-widest mb-2">NEURAL MESH — LIVE</div>
      <div className="flex items-center gap-4">
        <canvas ref={canvasRef} width={260} height={220} className="rounded border border-purple-900/20" />
        <div className="flex flex-col gap-3 flex-1">
          {[
            { label: 'ACTIVE AGENTS', value: `${activeCount} / ${agents.length}`, color: '#4ade80' },
            { label: 'AVG LOAD',      value: `${avgLoad}%`,                       color: '#a855f7' },
            { label: 'MESH STATUS',   value: 'NOMINAL',                           color: '#22d3ee' },
            { label: 'ROUTING AI',    value: 'ONLINE',                            color: '#d4af37' },
            { label: 'AUTO-OPT',      value: 'ENABLED',                           color: '#4ade80' },
          ].map(m => (
            <div key={m.label}>
              <div className="text-[9px] text-gray-600 mb-0.5">{m.label}</div>
              <div className="text-sm font-bold" style={{ color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}