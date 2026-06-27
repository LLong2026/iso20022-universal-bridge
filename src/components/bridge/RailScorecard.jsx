import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function RailScorecard({ rails, selectedRail }) {
  if (!rails.length) {
    return <div className="text-[9px] text-gray-600 py-4 text-center">NO RAILS REGISTERED</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[9px] font-mono">
        <thead>
          <tr className="text-gray-500 border-b border-[#222]">
            <th className="text-left py-1.5 px-2">RAIL</th>
            <th className="text-right px-2">COST</th>
            <th className="text-right px-2">SPEED</th>
            <th className="text-right px-2">LIQ</th>
            <th className="text-right px-2">COMP</th>
            <th className="text-right px-2">FIN</th>
            <th className="text-right px-2">SCORE</th>
          </tr>
        </thead>
        <tbody>
          {rails.map((r) => {
            const isSelected = selectedRail && selectedRail.rail_id === r.rail_id;
            return (
              <tr key={r.rail_id} className={`border-b border-[#1a1a1a] ${isSelected ? 'bg-[#d4af37]/10' : ''}`}>
                <td className="py-1.5 px-2">
                  <div className="flex items-center gap-1.5">
                    {isSelected && <CheckCircle className="w-3 h-3 text-[#d4af37] flex-shrink-0" />}
                    <span className={isSelected ? 'text-[#d4af37] font-bold' : 'text-gray-300'}>{r.name}</span>
                  </div>
                </td>
                <td className="text-right px-2 text-gray-500">{r.cost}</td>
                <td className="text-right px-2 text-gray-500">{r.speed}</td>
                <td className="text-right px-2 text-gray-500">{r.liquidity}</td>
                <td className="text-right px-2 text-gray-500">{r.compliance}</td>
                <td className="text-right px-2 text-gray-500">{r.finality}</td>
                <td className={`text-right px-2 font-bold ${isSelected ? 'text-[#d4af37]' : 'text-gray-400'}`}>{r.score.toFixed(4)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}