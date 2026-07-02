import React from 'react';

function settleTime(speed) {
  const ms = Math.round(1000000 / (speed || 1000));
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export default function RailScorecard({ rails, selectedName }) {
  return (
    <div className="border border-[#222] rounded bg-black/40 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="border-b border-[#222] text-gray-600 tracking-wider">
              <th className="text-left p-2 font-bold">RAIL</th>
              <th className="text-right p-2 font-bold">COST</th>
              <th className="text-right p-2 font-bold">SPEED</th>
              <th className="text-right p-2 font-bold">SETTLE</th>
              <th className="text-right p-2 font-bold">LIQ</th>
              <th className="text-right p-2 font-bold">COMP</th>
              <th className="text-right p-2 font-bold">FIN</th>
              <th className="text-right p-2 font-bold">SCORE</th>
            </tr>
          </thead>
          <tbody>
            {rails.map((r) => {
              const selected = selectedName && r.name === selectedName;
              return (
                <tr key={r.rail_id} className={`border-b border-[#1a1a1a] ${selected ? 'bg-[#d4af37]/10' : ''}`}>
                  <td className={`p-2 font-bold ${selected ? 'text-[#d4af37]' : 'text-gray-300'}`}>{r.name}</td>
                  <td className="text-right p-2 text-gray-400">{r.cost}</td>
                  <td className="text-right p-2 text-gray-400">{r.speed}</td>
                  <td className={`text-right p-2 font-bold ${selected ? 'text-[#d4af37]' : 'text-green-400'}`}>{settleTime(r.speed)}</td>
                  <td className="text-right p-2 text-gray-400">{r.liquidity}</td>
                  <td className="text-right p-2 text-gray-400">{r.compliance}</td>
                  <td className="text-right p-2 text-gray-400">{r.finality}</td>
                  <td className={`text-right p-2 font-bold ${selected ? 'text-[#d4af37]' : 'text-gray-300'}`}>{r.score.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}