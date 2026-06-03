import React from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { getDynamicProgressColor } from '../utils/colors';

const gaps = [
  { 
    area: 'Estratégia de IA Avançada', 
    dept: 'Depto de Engenharia', 
    impact: 'ALTO', 
    status: 45, 
    color: 'rose' 
  },
  { 
    area: 'Presença Executiva', 
    dept: 'Lideranças de Marketing', 
    impact: 'MÉDIO', 
    status: 15, 
    color: 'amber' 
  },
  { 
    area: 'Gestão de Mudanças', 
    dept: 'Suíte de Operações', 
    impact: 'ALTO', 
    status: 80, 
    color: 'rose' 
  },
];

const TalentGapsTable: React.FC = () => {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900">Gaps Críticos de Talento</h2>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Prioridades identificadas para o Q2</p>
          </div>
        </div>
        <span className="bg-primary-100 text-primary-700 text-[10px] font-black px-3 py-1 rounded-full border border-primary-200">
          3 IDENTIFICADOS
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
              <th className="px-6 py-4">Área Prioritária</th>
              <th className="px-6 py-4">Nível de Impacto</th>
              <th className="px-6 py-4">Status de Mitigação</th>
              <th className="px-6 py-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {gaps.map((gap, index) => (
              <tr key={index} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-5">
                  <p className="font-bold text-gray-900">{gap.area}</p>
                  <p className="text-gray-400 text-xs font-medium">{gap.dept}</p>
                </td>
                <td className="px-6 py-5">
                  <span className={`text-[10px] font-black px-2 py-1 rounded border ${
                    gap.impact === 'ALTO' 
                      ? 'bg-rose-50 text-rose-600 border-rose-100' 
                      : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {gap.impact}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden min-w-[120px]">
                      <div 
                        className="h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${gap.status}%`, backgroundColor: getDynamicProgressColor(gap.status) }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-gray-500">{gap.status}%</span>
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <button className="text-primary-600 text-xs font-black flex items-center gap-1 ml-auto hover:gap-2 transition-all">
                    REVISAR
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TalentGapsTable;
