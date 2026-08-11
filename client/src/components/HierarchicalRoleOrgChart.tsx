import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';
import RoleCardNode, { type RoleNodeData } from './RoleCardNode';

interface HierarchicalRoleOrgChartProps {
  rolesData: RoleNodeData[];
  onSelectRole: (roleName: string) => void;
  actionLabelGenerator?: (roleName: string) => string;
  actionColorTheme?: 'purple' | 'blue';
  metricsLabel?: string;
}

export const HierarchicalRoleOrgChart: React.FC<HierarchicalRoleOrgChartProps> = ({
  rolesData,
  onSelectRole,
  actionLabelGenerator,
  actionColorTheme = 'purple',
  metricsLabel,
}) => {
  // Pan and Zoom states
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Categorize roles into Seniority Levels (Level 1 -> Level 4)
  const getLevel = (roleName: string): number => {
    const r = roleName.toLowerCase();
    if (r.includes('gestor') || r.includes('gerente') || r.includes('head') || r.includes('bp') || r.includes('diretor') || r.includes('coordenador')) {
      return 1;
    }
    if (r.includes('especialista') || r.includes('lead') || r.includes('senior') || r.includes('sênior')) {
      return 2;
    }
    if (r.includes('analista') || r.includes('pleno') || r.includes('designer') || r.includes('pm')) {
      return 3;
    }
    return 4; // Dev, Jr, Assistente, Técnico, Estagiário
  };

  const levelLabels: Record<number, string> = {
    1: 'Nível 1: Liderança & Gestão Estratégica',
    2: 'Nível 2: Especialistas & Liderança Técnica',
    3: 'Nível 3: Analistas & Product/UX Pleno/Sr',
    4: 'Nível 4: Operacional & Desenvolvedores',
  };

  // Group roles by level
  const levelGroups: Record<number, RoleNodeData[]> = { 1: [], 2: [], 3: [], 4: [] };
  rolesData.forEach(r => {
    const lvl = getLevel(r.roleName);
    levelGroups[lvl].push({ ...r, levelRank: lvl });
  });

  const activeLevels = [1, 2, 3, 4].filter(lvl => levelGroups[lvl].length > 0);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return; // Allow button clicks
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const zoomIn = () => setZoom(prev => Math.min(prev + 0.15, 1.8));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.15, 0.5));
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="bg-gradient-to-b from-gray-50/50 to-white border border-gray-100 rounded-2xl shadow-inner relative overflow-hidden min-h-[500px]">
      {/* Controls Bar */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-xl border border-gray-200 shadow-md text-xs font-bold">
        <button
          onClick={zoomIn}
          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-700 transition-all"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={zoomOut}
          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-700 transition-all"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-[10px] font-mono text-gray-500 px-1">{Math.round(zoom * 100)}%</span>
        <button
          onClick={resetView}
          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-700 transition-all"
          title="Resetar Visão"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Drag Helper Notice */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-gray-100 text-[11px] font-extrabold text-gray-500 shadow-sm pointer-events-none">
        <Move className="w-3.5 h-3.5 text-purple-600" />
        Organograma Hierárquico (Arraste e Zoom ativados)
      </div>

      {/* Canvas Viewport */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`w-full min-h-[550px] p-10 flex justify-center items-start cursor-${isDragging ? 'grabbing' : 'grab'} select-none overflow-auto`}
      >
        {/* Scalable & Pannable Tree Container */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
          className="flex flex-col items-center gap-12 py-6 min-w-full"
        >
          {activeLevels.map((levelNum, index) => {
            const levelRoles = levelGroups[levelNum];
            const isLastLevel = index === activeLevels.length - 1;

            return (
              <div key={levelNum} className="flex flex-col items-center w-full relative">
                {/* Level Title Tag */}
                <div className="mb-4 bg-purple-50 text-purple-700 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-purple-100 shadow-xs z-10">
                  {levelLabels[levelNum]}
                </div>

                {/* Level Cards Row */}
                <div className="flex flex-wrap justify-center items-center gap-8 relative z-10">
                  {levelRoles.map((roleItem) => (
                    <RoleCardNode
                      key={roleItem.roleName}
                      roleName={roleItem.roleName}
                      membersCount={roleItem.members.length}
                      avgProgress={roleItem.avgProgress}
                      metricsLabel={metricsLabel}
                      actionLabel={actionLabelGenerator ? actionLabelGenerator(roleItem.roleName) : undefined}
                      actionColorTheme={actionColorTheme}
                      onSelectRole={onSelectRole}
                    />
                  ))}
                </div>

                {/* Orthogonal Connector Lines to Next Level */}
                {!isLastLevel && (
                  <div className="w-full flex flex-col items-center mt-6 z-0">
                    {/* Vertical Stem down from current level */}
                    <div className="w-0.5 h-6 bg-gray-300" />

                    {/* Horizontal Connector Bar */}
                    <div className="w-2/3 h-0.5 bg-gray-300" />

                    {/* Vertical Stem down to next level */}
                    <div className="w-0.5 h-6 bg-gray-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HierarchicalRoleOrgChart;
