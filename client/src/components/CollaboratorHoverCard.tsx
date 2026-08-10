import React, { useEffect, useState, useRef } from 'react';
import { User, Building2, UserCheck, Target, Award, Clock } from 'lucide-react';
import { getDynamicProgressColor } from '../utils/colors';

export interface HoverCardData {
  id: string;
  name: string;
  role: string;
  department?: string;
  superior_imediato?: string;
  pdiStatus?: string;
  pdiAverage?: number;
  alignmentScore?: number;
  evaluationStatus?: string;
  goalsCount?: number;
  actionsCount?: number;
  avatar?: string;
}

interface CollaboratorHoverCardProps {
  data: HoverCardData | null;
  anchorRect: DOMRect | null;
  isVisible: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const CollaboratorHoverCard: React.FC<CollaboratorHoverCardProps> = ({
  data,
  anchorRect,
  isVisible,
  onMouseEnter,
  onMouseLeave
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 });

  useEffect(() => {
    if (!isVisible || !anchorRect || !cardRef.current) return;

    const card = cardRef.current;
    const cardWidth = card.offsetWidth || 300;
    const cardHeight = card.offsetHeight || 280;

    const padding = 12;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Prefer positioning below the element
    let top = anchorRect.bottom + padding;
    let left = anchorRect.left + (anchorRect.width / 2) - (cardWidth / 2);

    // If overflows bottom, position above element
    if (top + cardHeight > windowHeight - padding) {
      top = anchorRect.top - cardHeight - padding;
    }

    // Clamp horizontally within viewport
    if (left + cardWidth > windowWidth - padding) {
      left = windowWidth - cardWidth - padding;
    }
    if (left < padding) {
      left = padding;
    }

    setCoords({ top, left });
  }, [anchorRect, isVisible, data]);

  if (!isVisible || !data) return null;

  const getPDIStatusBadge = (avg?: number, status?: string) => {
    if (status) {
      return { text: status, class: "bg-blue-50 text-blue-700 border-blue-200" };
    }
    if (avg === undefined) return null;
    if (avg >= 85) return { text: "On Track - Destaque", class: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (avg >= 70) return { text: "On Track", class: "bg-emerald-50 text-emerald-600 border-emerald-100" };
    if (avg >= 50) return { text: "Em Andamento", class: "bg-amber-50 text-amber-700 border-amber-200" };
    return { text: "Requer Atenção", class: "bg-rose-50 text-rose-700 border-rose-200" };
  };

  const statusBadge = getPDIStatusBadge(data.pdiAverage, data.pdiStatus);

  return (
    <div
      ref={cardRef}
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        zIndex: 9999
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="w-80 bg-white/95 backdrop-blur-md border border-gray-100 shadow-2xl rounded-2xl p-4 space-y-3 pointer-events-auto transition-opacity duration-200 animate-in fade-in zoom-in-95"
    >
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-gray-100 pb-3">
        <div className="w-11 h-11 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0 shadow-sm">
          {data.avatar ? (
            <img src={data.avatar} alt={data.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold text-gray-500 bg-gray-100">
              {data.name ? data.name.substring(0, 2).toUpperCase() : <User className="w-5 h-5" />}
            </div>
          )}
        </div>
        <div className="overflow-hidden flex-1">
          <h4 className="font-extrabold text-gray-900 text-sm truncate leading-snug">{data.name}</h4>
          <p className="text-gray-500 text-xs font-medium truncate">{data.role}</p>
          {statusBadge && (
            <span className={`inline-block text-[9px] font-black px-2 py-0.5 mt-1 rounded-full uppercase tracking-wider border ${statusBadge.class}`}>
              {statusBadge.text}
            </span>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="space-y-2 text-xs">
        {data.department && (
          <div className="flex items-center justify-between text-gray-600">
            <span className="font-semibold text-gray-400 text-[11px] flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              Área:
            </span>
            <span className="font-bold text-gray-800 truncate">{data.department}</span>
          </div>
        )}

        {data.superior_imediato && (
          <div className="flex items-center justify-between text-gray-600">
            <span className="font-semibold text-gray-400 text-[11px] flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-primary-500 shrink-0" />
              Gestor:
            </span>
            <span className="font-bold text-primary-700 truncate">{data.superior_imediato}</span>
          </div>
        )}

        {data.alignmentScore !== undefined && (
          <div className="flex items-center justify-between text-gray-600 pt-1 border-t border-gray-50">
            <span className="font-semibold text-gray-400 text-[11px]">Alinhamento ao Cargo:</span>
            <span className="font-black text-emerald-600">{data.alignmentScore}%</span>
          </div>
        )}

        {data.evaluationStatus && (
          <div className="flex items-center justify-between text-gray-600">
            <span className="font-semibold text-gray-400 text-[11px]">Avaliação:</span>
            <span className="font-bold text-gray-700">{data.evaluationStatus}</span>
          </div>
        )}
      </div>

      {/* PDI Metrics Section */}
      {(data.pdiAverage !== undefined || data.goalsCount !== undefined || data.actionsCount !== undefined) && (
        <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100 space-y-2.5">
          {data.pdiAverage !== undefined && (
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px] font-bold">
                <span className="text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  Conclusão do PDI
                </span>
                <span className="text-gray-900 font-extrabold">{data.pdiAverage}%</span>
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, data.pdiAverage))}%`,
                    backgroundColor: getDynamicProgressColor(data.pdiAverage)
                  }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100 text-center">
            {data.goalsCount !== undefined && (
              <div className="bg-white rounded-lg p-1.5 border border-gray-100">
                <div className="flex items-center justify-center gap-1 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                  <Target className="w-3 h-3 text-primary-600" />
                  Objetivos
                </div>
                <p className="text-xs font-black text-gray-900 mt-0.5">{data.goalsCount}</p>
              </div>
            )}

            {data.actionsCount !== undefined && (
              <div className="bg-white rounded-lg p-1.5 border border-gray-100">
                <div className="flex items-center justify-center gap-1 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                  <Award className="w-3 h-3 text-purple-600" />
                  Ações
                </div>
                <p className="text-xs font-black text-gray-900 mt-0.5">{data.actionsCount}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer hint */}
      <div className="pt-1 text-[10px] font-medium text-gray-400 text-center">
        💡 Clique no colaborador para abrir o PDI individual
      </div>
    </div>
  );
};

export default CollaboratorHoverCard;
