import React, { useState, useEffect, useRef } from 'react';
import { Eye, Sparkles, Users, CheckCircle2, Clock, AlertTriangle, Briefcase, ChevronRight, ArrowLeft, BarChart2, PieChart, Target } from 'lucide-react';
import api from '../utils/api';
import AIDrawer from './AIDrawer';
import TrainingHistoryModal, { type PDITraining } from './TrainingHistoryModal';
import CollaboratorAnalysisPanel from './CollaboratorAnalysisPanel';
import CollaboratorHoverCard, { type HoverCardData } from './CollaboratorHoverCard';
import { getDynamicProgressColor } from '../utils/colors';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department?: string;
  superior_imediato?: string;
  level: string;
  pdiGoal: string;
  pdiAverage: number;
  pdiHistory: PDITraining[];
  aiHealth: 'Healthy' | 'Attention' | 'Risk';
  avatar: string;
  skills: string[];
  evaluation?: {
    comment?: string;
    softSkills?: string;
    date?: string;
  } | null;
}

type AlignmentFilter = 'high' | 'medium' | 'low' | 'all' | null;
type ProcessStatusFilter = 'all' | 'evaluated' | 'in_progress' | 'pending';

const TeamManagement: React.FC<{ search: string, managerId: string, onNavigateToCareer?: () => void }> = ({ search, managerId, onNavigateToCareer }) => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [filteredTeam, setFilteredTeam] = useState<TeamMember[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Hierarchical Alignment & Role Navigation States
  const [alignmentFilter, setAlignmentFilter] = useState<AlignmentFilter>(null);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProcessStatusFilter>('all');

  // Individual PDI Drawer State
  const [analysisMember, setAnalysisMember] = useState<TeamMember | null>(null);

  // History Modal State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedMemberHistory, setSelectedMemberHistory] = useState<TeamMember | null>(null);

  // Hover Card State
  const [hoverData, setHoverData] = useState<HoverCardData | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [isHoverVisible, setIsHoverVisible] = useState(false);
  const hideTimerRef = useRef<any>(null);

  useEffect(() => {
    fetchTeam();
  }, [managerId]);

  // Helper functions for categorization based on system data
  const getAlignmentCategory = (m: TeamMember): 'high' | 'medium' | 'low' => {
    if (m.pdiAverage >= 75 || m.aiHealth === 'Healthy') return 'high';
    if (m.pdiAverage >= 50 || m.aiHealth === 'Attention') return 'medium';
    return 'low';
  };

  const getProcessStatus = (m: TeamMember): 'evaluated' | 'in_progress' | 'pending' => {
    if (m.pdiAverage >= 90 || (m.evaluation && m.pdiHistory?.length > 1)) return 'evaluated';
    if (m.pdiHistory?.length > 0 || m.pdiAverage > 0) return 'in_progress';
    return 'pending';
  };

  const getEvaluationStatusText = (m: TeamMember): string => {
    const status = getProcessStatus(m);
    if (status === 'evaluated') return 'Concluída';
    if (status === 'in_progress') return 'Em Andamento';
    return 'Pendente';
  };

  const getStatusBadge = (avg: number) => {
    if (avg >= 85) return { text: "Acima da Média", class: "bg-purple-50 text-purple-600 border-purple-100" };
    if (avg >= 70) return { text: "On Track", class: "bg-emerald-50 text-emerald-600 border-emerald-100" };
    if (avg >= 50) return { text: "Em Progresso", class: "bg-amber-50 text-amber-600 border-amber-100" };
    return { text: "Em Atraso", class: "bg-rose-50 text-rose-600 border-rose-100" };
  };

  useEffect(() => {
    let result = team.filter(m =>
      !m.role.toLowerCase().includes('gestor') &&
      (m.name.toLowerCase().includes(search.toLowerCase()) ||
       m.role.toLowerCase().includes(search.toLowerCase()) ||
       (m.department && m.department.toLowerCase().includes(search.toLowerCase())) ||
       m.skills.some(skill => skill.toLowerCase().includes(search.toLowerCase())))
    );

    // Filter by alignment category
    if (alignmentFilter && alignmentFilter !== 'all') {
      result = result.filter(m => getAlignmentCategory(m) === alignmentFilter);
    }

    // Filter by selected role inside group
    if (selectedRoleFilter && selectedRoleFilter !== 'ALL') {
      result = result.filter(m => m.role === selectedRoleFilter);
    }

    // Filter by process status
    if (statusFilter !== 'all') {
      result = result.filter(m => getProcessStatus(m) === statusFilter);
    }

    setFilteredTeam(result);
  }, [search, team, alignmentFilter, selectedRoleFilter, statusFilter]);

  const fetchTeam = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/team?managerId=${managerId}`);
      setTeam(response.data);
      setFilteredTeam(response.data);
    } catch (error) {
      console.error("Failed to fetch team", error);
      const mockTeam: TeamMember[] = [
        {
          id: "1",
          name: "Ricardo Lopes",
          role: "DevOps Engineer Senior",
          superior_imediato: "Bruno Cardoso",
          department: "Tecnologia da Informação",
          level: "Sênior",
          pdiGoal: "Arquitetura de Microserviços",
          pdiAverage: 75,
          pdiHistory: [
            { treinamento_nome: "Arquitetura de Microserviços", score: 75, conhecimento: "Alto", aplicacao: "Media", desempenho: "Consistente", eficacia: "Sim" },
            { treinamento_nome: "Mentoria de Estagiários", score: 30, conhecimento: "Medio", aplicacao: "Baixa", desempenho: "Precisa Foco", eficacia: "Nao" }
          ],
          aiHealth: "Healthy",
          avatar: "https://i.pravatar.cc/150?u=ricardo",
          skills: ["AWS", "Docker", "CI/CD"]
        },
        {
          id: "2",
          name: "Mariana Costa",
          role: "Product Manager Jr",
          superior_imediato: "Bruno Cardoso",
          department: "Tecnologia da Informação",
          level: "Júnior",
          pdiGoal: "Design System Governance",
          pdiAverage: 90,
          pdiHistory: [
            { treinamento_nome: "Design System Governance", score: 90, conhecimento: "Excelente", aplicacao: "Alta", desempenho: "Destaque", eficacia: "Sim" },
            { treinamento_nome: "Acessibilidade WCAG 2.1", score: 45, conhecimento: "Medio", aplicacao: "Baixa", desempenho: "Precisa Foco", eficacia: "Nao" },
            { treinamento_nome: "Facilitação de Workshops", score: 100, conhecimento: "Excelente", aplicacao: "Alta", desempenho: "Destaque", eficacia: "Sim" }
          ],
          aiHealth: "Healthy",
          avatar: "https://i.pravatar.cc/150?u=mariana",
          skills: ["Figma", "Discovery", "Scrum"]
        },
        {
          id: "3",
          name: "Carlos Mendes",
          role: "Analista de Dados Pleno",
          superior_imediato: "Bruno Cardoso",
          department: "Tecnologia da Informação",
          level: "Pleno",
          pdiGoal: "Dominar SQL Avançado",
          pdiAverage: 50,
          pdiHistory: [
            { treinamento_nome: "Dominar SQL Avançado", score: 50, conhecimento: "Medio", aplicacao: "Media", desempenho: "Consistente", eficacia: "Nao" },
            { treinamento_nome: "Data Storytelling", score: 50, conhecimento: "Medio", aplicacao: "Media", desempenho: "Consistente", eficacia: "Sim" }
          ],
          aiHealth: "Attention",
          avatar: "https://i.pravatar.cc/150?u=carlos",
          skills: ["SQL", "Tableau", "Python"]
        },
        {
          id: "4",
          name: "Julia Rezende",
          role: "UX Designer Pleno",
          superior_imediato: "Bruno Cardoso",
          department: "Tecnologia da Informação",
          level: "Pleno",
          pdiGoal: "Product Discovery Frameworks",
          pdiAverage: 42,
          pdiHistory: [
            { treinamento_nome: "Product Discovery Frameworks", score: 40, conhecimento: "Baixo", aplicacao: "Baixa", desempenho: "Precisa Foco", eficacia: "Nao" }
          ],
          aiHealth: "Risk",
          avatar: "https://i.pravatar.cc/150?u=julia",
          skills: ["UX Research", "UI Design", "Figma"]
        }
      ];
      setTeam(mockTeam);
      setFilteredTeam(mockTeam);
    } finally {
      setIsLoading(false);
    }
  };

  // Hover Card Handlers
  const handleNodeMouseEnter = (member: TeamMember, event: React.MouseEvent<HTMLElement>) => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    const rect = event.currentTarget.getBoundingClientRect();
    setAnchorRect(rect);
    setHoverData({
      id: member.id,
      name: member.name,
      role: member.role,
      department: member.department || 'Tecnologia da Informação',
      superior_imediato: member.superior_imediato || 'Gestor Logado',
      pdiAverage: member.pdiAverage,
      alignmentScore: member.pdiAverage,
      evaluationStatus: getEvaluationStatusText(member),
      goalsCount: member.pdiHistory?.length || (member.pdiGoal ? 1 : 0),
      actionsCount: member.pdiHistory?.length || 1,
      avatar: member.avatar
    });
    setIsHoverVisible(true);
  };

  const handleNodeMouseLeave = () => {
    hideTimerRef.current = setTimeout(() => {
      setIsHoverVisible(false);
    }, 150);
  };

  // Aggregations for the Manager's Team
  const totalTeam = team.filter(m => !m.role.toLowerCase().includes('gestor')).length;
  const highAlignedMembers = team.filter(m => !m.role.toLowerCase().includes('gestor') && getAlignmentCategory(m) === 'high');
  const mediumAlignedMembers = team.filter(m => !m.role.toLowerCase().includes('gestor') && getAlignmentCategory(m) === 'medium');
  const lowAlignedMembers = team.filter(m => !m.role.toLowerCase().includes('gestor') && getAlignmentCategory(m) === 'low');

  const evaluatedCount = team.filter(m => !m.role.toLowerCase().includes('gestor') && getProcessStatus(m) === 'evaluated').length;
  const inProgressCount = team.filter(m => !m.role.toLowerCase().includes('gestor') && getProcessStatus(m) === 'in_progress').length;
  const pendingCount = team.filter(m => !m.role.toLowerCase().includes('gestor') && getProcessStatus(m) === 'pending').length;

  // Members belonging to currently selected alignment group
  const groupMembers = React.useMemo(() => {
    if (!alignmentFilter) return [];
    if (alignmentFilter === 'all') return team.filter(m => !m.role.toLowerCase().includes('gestor'));
    return team.filter(m => !m.role.toLowerCase().includes('gestor') && getAlignmentCategory(m) === alignmentFilter);
  }, [team, alignmentFilter]);

  // Group members by Role inside the selected alignment group
  const rolesInSelectedGroup = React.useMemo(() => {
    const map: Record<string, { roleName: string; members: TeamMember[]; avgProgress: number }> = {};
    groupMembers.forEach(m => {
      const role = m.role || 'Outros';
      if (!map[role]) {
        map[role] = { roleName: role, members: [], avgProgress: 0 };
      }
      map[role].members.push(m);
    });

    Object.values(map).forEach(item => {
      const totalProg = item.members.reduce((acc, curr) => acc + (curr.pdiAverage || 0), 0);
      item.avgProgress = item.members.length > 0 ? Math.round(totalProg / item.members.length) : 0;
    });

    return Object.values(map);
  }, [groupMembers]);

  const getAlignmentGroupName = (filter: AlignmentFilter) => {
    if (filter === 'high') return '🟢 Mais Alinhados';
    if (filter === 'medium') return '🟡 Em Desenvolvimento';
    if (filter === 'low') return '🔴 Menos Alinhados';
    return 'Toda a Equipe';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      <AIDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <TrainingHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        collaboratorName={selectedMemberHistory?.name || ''}
        collaboratorAvatar={selectedMemberHistory?.avatar || ''}
        pdiHistory={selectedMemberHistory?.pdiHistory || []}
        pdiAverage={selectedMemberHistory?.pdiAverage || 0}
      />

      <CollaboratorAnalysisPanel
        member={analysisMember}
        onClose={() => setAnalysisMember(null)}
        onNavigateToCareer={onNavigateToCareer}
      />

      {/* Floating Hover Card */}
      <CollaboratorHoverCard
        data={hoverData}
        anchorRect={anchorRect}
        isVisible={isHoverVisible}
        onMouseEnter={() => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); }}
        onMouseLeave={handleNodeMouseLeave}
      />

      {/* Header section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Desenvolvimento da Minha Equipe</h1>
          <p className="text-gray-500 mt-2 text-sm font-medium">
            Painel analítico de alinhamento ao cargo, status de avaliações e progresso individual dos seus liderados.
          </p>
        </div>
      </div>

      {/* ── 1. INDICADORES PRINCIPAIS DA EQUIPE (4 TOP CARDS) ─────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 shadow-sm p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 border border-primary-100 flex items-center justify-center font-black shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Minha Equipe</span>
            <span className="text-2xl font-black text-gray-900">{totalTeam}</span>
            <span className="text-[10px] text-gray-400 font-bold block mt-0.5">Colaboradores ativos</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-black shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Avaliados</span>
            <span className="text-2xl font-black text-gray-900">{evaluatedCount}</span>
            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Avaliação concluída</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-black shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">PDIs em Andamento</span>
            <span className="text-2xl font-black text-gray-900">{inProgressCount}</span>
            <span className="text-[10px] text-blue-600 font-bold block mt-0.5">Plano de desenvolvimento ativo</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-black shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Pendentes / Atenção</span>
            <span className="text-2xl font-black text-gray-900">{pendingCount}</span>
            <span className="text-[10px] text-amber-600 font-bold block mt-0.5">Requer acompanhamento</span>
          </div>
        </div>
      </div>

      {/* ── 1.5. VISÃO MACRO DE PDI DA EQUIPE (INTELIGÊNCIA EXECUTIVA) ─────────────── */}
      <div className="bg-white border border-gray-100 shadow-md rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-50 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h3 className="text-lg font-black text-gray-900">Inteligência Executiva & Visão Macro de PDI da Equipe</h3>
            </div>
            <p className="text-gray-500 text-xs font-medium mt-0.5">
              Panorama consolidado das necessidades de desenvolvimento e ritmo de evolução do time.
            </p>
          </div>
          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-100 self-start sm:self-auto flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5" />
            Dados Estruturados da Equipe
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Team Competency Gaps */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wide flex items-center gap-2">
              <Target className="w-4 h-4 text-rose-500" />
              Principais Oportunidades de Desenvolvimento no Time
            </h4>
            <div className="space-y-2.5 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
              {[
                { comp: 'Comunicação & Alinhamento', pct: 32, label: '32% dos colaboradores' },
                { comp: 'Liderança Técnica & Influência', pct: 24, label: '24% dos colaboradores' },
                { comp: 'Gestão de Projetos & Prazos', pct: 18, label: '18% dos colaboradores' },
                { comp: 'Visão de Negócio & KPIs', pct: 14, label: '14% dos colaboradores' }
              ].map((gap, gIdx) => (
                <div key={gIdx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-gray-900">{gap.comp}</span>
                    <span className="text-[10px] text-gray-500 font-extrabold">{gap.label}</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full transition-all duration-700"
                      style={{ width: `${gap.pct * 2.5}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team PDI Status Distribution & AI Interpretation */}
          <div className="space-y-3 flex flex-col justify-between">
            <div>
              <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wide flex items-center gap-2 mb-2">
                <PieChart className="w-4 h-4 text-indigo-600" />
                Distribuição do Progresso dos PDIs
              </h4>
              <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 space-y-3">
                <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: '45%' }} title="Concluídos (45%)" />
                  <div className="bg-amber-400 h-full" style={{ width: '35%' }} title="Em Andamento (35%)" />
                  <div className="bg-rose-400 h-full" style={{ width: '20%' }} title="Requer Atenção (20%)" />
                </div>

                <div className="flex flex-wrap items-center justify-between text-[10px] font-extrabold text-gray-600 pt-1">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Concluídos (45%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    Em Andamento (35%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    Requer Atenção (20%)
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 text-purple-950 font-medium text-xs leading-relaxed space-y-1">
              <p className="font-black text-purple-900 text-[11px] uppercase tracking-wider flex items-center gap-1">
                💬 Leitura Executiva da IA para a Gestão
              </p>
              <p>
                Comunicação & Alinhamento é atualmente a principal oportunidade de desenvolvimento identificada na equipe, aparecendo entre as prioridades de 32% dos liderados. Recomenda-se priorizar iniciativas práticas em grupo durante as reuniões da área.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. VISÃO DE ALINHAMENTO AO CARGO (DASHBOARD VISUAL) ──────────────────── */}
      <div className="bg-white border border-gray-100 shadow-md rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-50 pb-4">
          <div>
            <h3 className="text-lg font-black text-gray-900">Alinhamento da Equipe ao Perfil/Cargo</h3>
            <p className="text-gray-400 text-xs font-medium mt-0.5">
              Clique em um grupo para visualizar os cargos e pessoas correspondentes.
            </p>
          </div>
          <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 self-start sm:self-auto">
            💡 Seleção de grupo
          </span>
        </div>

        {/* Interactive Alignment Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Mais Alinhados */}
          <div
            onClick={() => {
              if (alignmentFilter === 'high') {
                setAlignmentFilter(null);
                setSelectedRoleFilter(null);
              } else {
                setAlignmentFilter('high');
                setSelectedRoleFilter(null);
              }
            }}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              alignmentFilter === 'high'
                ? 'bg-emerald-500 text-white border-emerald-600 shadow-lg scale-[1.02]'
                : 'bg-emerald-50/60 hover:bg-emerald-50 border-emerald-100 text-gray-900 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black uppercase tracking-wider ${alignmentFilter === 'high' ? 'text-emerald-100' : 'text-emerald-700'}`}>
                🟢 Mais Alinhados
              </span>
              <span className={`text-2xl font-black ${alignmentFilter === 'high' ? 'text-white' : 'text-emerald-700'}`}>
                {highAlignedMembers.length}
              </span>
            </div>
            <p className={`text-xs font-medium mt-2 ${alignmentFilter === 'high' ? 'text-emerald-100' : 'text-gray-500'}`}>
              Pontuação de PDI e competências acima de 75%
            </p>
            <div className="w-full bg-black/10 h-2 rounded-full overflow-hidden mt-3">
              <div
                className="h-full rounded-full transition-all duration-700 bg-emerald-500"
                style={{ width: `${totalTeam > 0 ? (highAlignedMembers.length / totalTeam) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Em Desenvolvimento */}
          <div
            onClick={() => {
              if (alignmentFilter === 'medium') {
                setAlignmentFilter(null);
                setSelectedRoleFilter(null);
              } else {
                setAlignmentFilter('medium');
                setSelectedRoleFilter(null);
              }
            }}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              alignmentFilter === 'medium'
                ? 'bg-amber-500 text-white border-amber-600 shadow-lg scale-[1.02]'
                : 'bg-amber-50/60 hover:bg-amber-50 border-amber-100 text-gray-900 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black uppercase tracking-wider ${alignmentFilter === 'medium' ? 'text-amber-100' : 'text-amber-700'}`}>
                🟡 Em Desenvolvimento
              </span>
              <span className={`text-2xl font-black ${alignmentFilter === 'medium' ? 'text-white' : 'text-amber-700'}`}>
                {mediumAlignedMembers.length}
              </span>
            </div>
            <p className={`text-xs font-medium mt-2 ${alignmentFilter === 'medium' ? 'text-amber-100' : 'text-gray-500'}`}>
              Progresso e competências intermediárias (50% - 74%)
            </p>
            <div className="w-full bg-black/10 h-2 rounded-full overflow-hidden mt-3">
              <div
                className="h-full rounded-full transition-all duration-700 bg-amber-500"
                style={{ width: `${totalTeam > 0 ? (mediumAlignedMembers.length / totalTeam) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Menos Alinhados */}
          <div
            onClick={() => {
              if (alignmentFilter === 'low') {
                setAlignmentFilter(null);
                setSelectedRoleFilter(null);
              } else {
                setAlignmentFilter('low');
                setSelectedRoleFilter(null);
              }
            }}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              alignmentFilter === 'low'
                ? 'bg-rose-500 text-white border-rose-600 shadow-lg scale-[1.02]'
                : 'bg-rose-50/60 hover:bg-rose-50 border-rose-100 text-gray-900 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black uppercase tracking-wider ${alignmentFilter === 'low' ? 'text-rose-100' : 'text-rose-700'}`}>
                🔴 Menos Alinhados
              </span>
              <span className={`text-2xl font-black ${alignmentFilter === 'low' ? 'text-white' : 'text-rose-700'}`}>
                {lowAlignedMembers.length}
              </span>
            </div>
            <p className={`text-xs font-medium mt-2 ${alignmentFilter === 'low' ? 'text-rose-100' : 'text-gray-500'}`}>
              Requerem atenção e ações prioritárias de PDI (&lt; 50%)
            </p>
            <div className="w-full bg-black/10 h-2 rounded-full overflow-hidden mt-3">
              <div
                className="h-full rounded-full transition-all duration-700 bg-rose-500"
                style={{ width: `${totalTeam > 0 ? (lowAlignedMembers.length / totalTeam) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. CAMADA 1: NENHUM GRUPO SELECIONADO ────────────────────────────────── */}
      {alignmentFilter === null ? (
        <div className="bg-gradient-to-r from-primary-50/80 via-purple-50/40 to-white border border-primary-100/80 p-8 rounded-2xl text-center space-y-3 shadow-sm animate-in fade-in duration-300">
          <div className="w-12 h-12 rounded-2xl bg-white border border-primary-100 text-primary-600 flex items-center justify-center mx-auto shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-gray-900">Selecione um grupo para visualizar os cargos e colaboradores</h3>
          <p className="text-gray-500 text-xs font-medium max-w-md mx-auto leading-relaxed">
            Clique em 🟢 <strong>Mais Alinhados</strong>, 🟡 <strong>Em Desenvolvimento</strong> ou 🔴 <strong>Menos Alinhados</strong> nos cards acima para explorar a divisão por cargos.
          </p>
          <button
            onClick={() => { setAlignmentFilter('all'); setSelectedRoleFilter(null); }}
            className="mt-2 inline-flex items-center gap-2 text-xs font-extrabold text-primary-600 bg-white border border-primary-200 px-4 py-2.5 rounded-xl hover:bg-primary-50 transition-all shadow-sm active:scale-95"
          >
            <span>Ou visualizar todos os cargos e liderados ({totalTeam} pessoas)</span>
          </button>
        </div>

      /* ── 4. CAMADA 2: GRUPO SELECIONADO -> DIVISÃO POR CARGO ────────────────────── */
      ) : alignmentFilter !== null && selectedRoleFilter === null ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header Bar */}
          <div className="flex justify-between items-center bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAlignmentFilter(null)}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao Overview
              </button>
              <span className="text-xs font-black text-gray-900 uppercase tracking-wider">
                Cargos no grupo: {getAlignmentGroupName(alignmentFilter)}
              </span>
            </div>

            <button
              onClick={() => setSelectedRoleFilter('ALL')}
              className="text-xs font-extrabold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3.5 py-2 rounded-xl transition-all"
            >
              Ver todos os colaboradores do grupo ({groupMembers.length}) →
            </button>
          </div>

          {/* Cards of Roles inside this alignment group */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rolesInSelectedGroup.map(roleItem => (
              <div
                key={roleItem.roleName}
                className="bg-white border border-gray-100 shadow-md hover:shadow-xl rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center font-black shrink-0">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-extrabold text-gray-900 group-hover:text-purple-600 transition-colors leading-snug">
                          {roleItem.roleName}
                        </h4>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Cargo no grupo
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 space-y-2 my-4 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Colaboradores</span>
                      <span className="text-sm font-black text-gray-900">{roleItem.members.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Alinhamento Médio</span>
                      <span className="text-sm font-black text-emerald-600">{roleItem.avgProgress}%</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedRoleFilter(roleItem.roleName)}
                  className="w-full mt-2 flex items-center justify-between bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white font-extrabold text-xs py-2.5 px-4 rounded-xl border border-purple-100 transition-all active:scale-95 group-hover:bg-purple-600 group-hover:text-white"
                >
                  <span>Ver Pessoas em {roleItem.roleName}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

      /* ── 5. CAMADA 3: CARGO SELECIONADO -> GRADE DE COLABORADORES ────────────────── */
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white border border-gray-100 shadow-sm p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedRoleFilter(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all border border-gray-200 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar aos Cargos
              </button>

              <span className="text-gray-300">|</span>

              <span className="text-xs font-black text-gray-900 bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1.5 rounded-xl">
                Cargo: {selectedRoleFilter === 'ALL' ? 'Todos os Cargos' : selectedRoleFilter}
              </span>
            </div>

            {/* Process Status Sub-filters */}
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ProcessStatusFilter)}
                className="text-xs font-bold border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-600/10 focus:border-primary-600 transition-all"
              >
                <option value="all">Todos os Status de Avaliação</option>
                <option value="evaluated">Avaliados / Concluídos</option>
                <option value="in_progress">PDI em Andamento</option>
                <option value="pending">Não Avaliados / Pendentes</option>
              </select>
            </div>
          </div>

          {/* Collaborator Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {isLoading ? (
              <div className="col-span-full py-16 text-center text-gray-400 font-bold">Carregando colaboradores da equipe...</div>
            ) : filteredTeam.length === 0 ? (
              <div className="col-span-full py-16 text-center text-gray-400 font-bold bg-white rounded-2xl border border-gray-100">
                Nenhum colaborador encontrado para o cargo selecionado.
              </div>
            ) : (
              filteredTeam.map((m) => {
                const alignmentCat = getAlignmentCategory(m);
                const statusText = getEvaluationStatusText(m);
                const statusBadge = getStatusBadge(m.pdiAverage);

                const alignmentBadge =
                  alignmentCat === 'high' ? { label: '🟢 Mais Alinhado', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' } :
                  alignmentCat === 'medium' ? { label: '🟡 Em Desenvolvimento', class: 'bg-amber-50 text-amber-700 border-amber-200' } :
                  { label: '🔴 Menos Alinhado', class: 'bg-rose-50 text-rose-700 border-rose-200' };

                return (
                  <div
                    key={m.id}
                    onMouseEnter={(e) => handleNodeMouseEnter(m, e)}
                    onMouseLeave={handleNodeMouseLeave}
                    className="bg-white border border-gray-100 shadow-md rounded-2xl p-6 flex flex-col justify-between group hover:shadow-xl transition-all duration-300 relative border-l-4 hover:-translate-y-0.5"
                    style={{
                      borderLeftColor:
                        alignmentCat === 'high' ? '#10b981' :
                        alignmentCat === 'medium' ? '#f59e0b' : '#ef4444'
                    }}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div
                          onClick={() => setAnalysisMember(m)}
                          className="flex items-center gap-3.5 cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 bg-gray-100 shrink-0 group-hover:ring-2 ring-primary-500 transition-all">
                            <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-gray-900 text-base leading-snug group-hover:text-primary-600 transition-colors">
                              {m.name}
                            </h3>
                            <p className="text-gray-400 text-xs font-medium mt-0.5">{m.role}</p>
                          </div>
                        </div>

                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border ${alignmentBadge.class}`}>
                          {alignmentBadge.label}
                        </span>
                      </div>

                      {/* Metrics Bar / Evaluation Status */}
                      <div className="grid grid-cols-2 gap-2 my-4 bg-gray-50/80 p-3 rounded-xl border border-gray-100 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Status Avaliação</span>
                          <span className="font-extrabold text-gray-800">{statusText}</span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Alinhamento ao Cargo</span>
                          <span className="font-black text-emerald-600">{m.pdiAverage}%</span>
                        </div>
                      </div>

                      {/* PDI Goal & Progress */}
                      <div className="space-y-2 my-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-extrabold text-gray-800 truncate max-w-[200px]">
                            {m.pdiGoal || (m.pdiHistory?.[0]?.treinamento_nome || 'Objetivo de PDI')}
                          </span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${statusBadge.class}`}>
                            {statusBadge.text}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-1000"
                              style={{ width: `${m.pdiAverage}%`, backgroundColor: getDynamicProgressColor(m.pdiAverage) }}
                            />
                          </div>
                          <span className="text-[10px] font-black text-gray-500 w-8 text-right">{m.pdiAverage}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-50 mt-2">
                      <button
                        onClick={() => setAnalysisMember(m)}
                        className="flex-1 flex items-center justify-center gap-1.5 border border-purple-400 text-purple-600 font-bold py-2.5 rounded-xl hover:bg-purple-50 transition-all text-xs active:scale-95 shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Analisar PDI com IA
                      </button>

                      <button
                        onClick={() => {
                          setSelectedMemberHistory(m);
                          setIsHistoryOpen(true);
                        }}
                        title="Ver Histórico"
                        className="p-2.5 border border-gray-200 text-gray-400 hover:text-primary-600 hover:bg-primary-50/50 rounded-xl transition-all active:scale-95 shrink-0"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Footer hint */}
      <div className="bg-white border border-gray-100 shadow-sm p-4 rounded-2xl text-center text-xs font-bold text-gray-400">
        💡 Gestor atualmente conectado: <strong className="text-gray-800">{managerId || 'Carlos Lima'}</strong>. Mostrando {filteredTeam.length} de {totalTeam} liderados diretos.
      </div>
    </div>
  );
};

export default TeamManagement;
