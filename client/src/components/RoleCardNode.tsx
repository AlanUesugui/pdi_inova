import React from 'react';
import { Briefcase, ChevronRight } from 'lucide-react';
import type { TeamMember } from './TeamManagement';

export interface RoleNodeData {
  roleName: string;
  members: TeamMember[];
  avgProgress: number;
  levelRank: number; // 1: Leadership/BP, 2: Coordination/Specialist, 3: Senior/Pleno/Jr Analyst, 4: Dev/Tech/Assistant
}

export interface RoleCardNodeProps {
  roleName: string;
  membersCount: number;
  avgProgress?: number;
  metricsLabel?: string;
  actionLabel?: string;
  actionColorTheme?: 'purple' | 'blue';
  onSelectRole: (roleName: string) => void;
}

export const RoleCardNode: React.FC<RoleCardNodeProps> = ({
  roleName,
  membersCount,
  avgProgress,
  metricsLabel = 'ALINHAMENTO MÉDIO',
  actionLabel,
  actionColorTheme = 'purple',
  onSelectRole,
}) => {
  const isBlue = actionColorTheme === 'blue';
  const iconBgClass = isBlue ? 'bg-blue-50 border-blue-100 text-[#1E4382]' : 'bg-purple-50 border-purple-100 text-purple-600';
  const titleHoverClass = isBlue ? 'group-hover:text-[#1E4382]' : 'group-hover:text-purple-600';
  const btnClass = isBlue
    ? 'bg-blue-50/80 hover:bg-[#1E4382] text-[#1E4382] hover:text-white border-blue-100/80 group-hover:bg-[#1E4382] group-hover:text-white'
    : 'bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white border-purple-100 group-hover:bg-purple-600 group-hover:text-white';

  return (
    <div className="bg-white border border-gray-100 shadow-md hover:shadow-xl rounded-2xl p-5 w-72 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 relative shrink-0">
      <div>
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black shrink-0 ${iconBgClass}`}>
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <h4 className={`text-sm font-extrabold text-gray-900 transition-colors leading-tight truncate ${titleHoverClass}`} title={roleName}>
              {roleName}
            </h4>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mt-0.5">
              CARGO NO GRUPO
            </span>
          </div>
        </div>

        {/* Metrics */}
        <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 space-y-2 my-3 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">COLABORADORES</span>
            <span className="text-sm font-black text-gray-900">{membersCount}</span>
          </div>
          {typeof avgProgress === 'number' && (
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{metricsLabel}</span>
              <span className="text-sm font-black text-emerald-600">{avgProgress}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <button
        onClick={() => onSelectRole(roleName)}
        className={`w-full mt-1 flex items-center justify-between font-extrabold text-xs py-2 px-3 rounded-xl border transition-all active:scale-95 ${btnClass}`}
      >
        <span className="truncate">{actionLabel || `Ver Pessoas em ${roleName}`}</span>
        <ChevronRight className="w-4 h-4 shrink-0 ml-1" />
      </button>
    </div>
  );
};

export default RoleCardNode;
