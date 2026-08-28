import React, { useState, useEffect } from 'react';
import {
  MessageSquare, Calendar, Plus, Check, X, Sparkles, Clock,
  User, CheckCircle2, AlertCircle, ThumbsUp, ArrowUpRight, Link as LinkIcon,
  Target, AlertTriangle, ArrowLeft
} from 'lucide-react';
import api from '../utils/api';
import HierarchicalRoleOrgChart from './HierarchicalRoleOrgChart';

interface Collaborator {
  id: string;
  name: string;
  role: string;
  avatar: string;
  aiHealth: 'Healthy' | 'Attention' | 'Risk';
  pdiAverage: number;
  pdiGoal?: string;
  level?: string;
  skills?: string[];
  pdiHistory?: {
    treinamento_nome: string;
    conhecimento: string;
    aplicacao: string;
    desempenho: string;
    eficacia: string;
    score: number;
  }[];
}

interface Feedback {
  id: number;
  id_colaborador: string;
  gestor_id: string;
  tipo: 'Positivo' | 'Desenvolvimento' | 'Construtivo';
  conteudo: string;
  data: string;
}

interface Meeting {
  id: number;
  id_colaborador: string;
  gestor_id: string;
  data: string;
  hora: string;
  tipo: string;
  status: 'Agendado' | 'Realizado' | 'Cancelado';
  link: string;
  observacoes: string;
}

interface Analysis {
  momentoAtual: string;
  pontosAtencao: string[];
  destaques: string[];
  recomendacoes: string[];
  proximoPasso: string;
  projecao: string;
}

const generateAnalysis = (m: Collaborator): Analysis => {
  const lateItems = m.pdiHistory?.filter(t => t.score < 50) || [];
  const goodItems = m.pdiHistory?.filter(t => t.score >= 70) || [];
  const topTraining = m.pdiHistory?.[0];
  const firstName = m.name.split(' ')[0];

  const statusLabel =
    m.pdiAverage >= 85 ? 'acima da média esperada para o nível' :
    m.pdiAverage >= 70 ? 'dentro do ritmo esperado para o período' :
    m.pdiAverage >= 50 ? 'em progresso moderado, com oportunidades de aceleração' :
    'abaixo do esperado, requerendo atenção imediata';

  return {
    momentoAtual: `${m.name} está ${statusLabel}. Com foco em "${topTraining?.treinamento_nome || m.pdiGoal || 'seu PDI'}", o progresso consolidado de ${m.pdiAverage}% indica ${m.pdiAverage >= 70 ? 'uma trajetória sólida e consistente com o plano estabelecido' : 'a necessidade de revisão e reforço no plano de desenvolvimento'}. Nível ${m.level || m.role} — ${m.pdiAverage >= 80 ? 'elegível para desafios de maior complexidade no próximo ciclo' : 'deve consolidar as competências atuais antes de avançar de nível'}.`,

    pontosAtencao: [
      ...lateItems.map(t =>
        `"${t.treinamento_nome}" com ${t.score}% está abaixo do esperado. Aplicação ${(t.aplicacao || 'indefinida').toLowerCase()} indica pouca prática no dia a dia.`
      ),
      ...(m.pdiAverage < 60 ? [`Engajamento geral em ${m.pdiAverage}% — revisar a relevância dos objetivos traçados junto ao colaborador.`] : []),
      ...(lateItems.length === 0 && m.pdiAverage >= 70 ? ['Sem pontos críticos detectados. Manter cadência e monitorar a próxima janela de avaliação.'] : []),
    ],

    destaques: [
      ...goodItems.map(t =>
        `"${t.treinamento_nome}" com ${t.score}% — desempenho ${(t.desempenho || 'acima da média').toLowerCase()}. Eficácia: ${t.eficacia === 'Sim' ? 'aplicação prática confirmada' : 'potencial de aplicação identificado'}.`
      ),
      ...(m.pdiAverage >= 80 ? [`Média de ${m.pdiAverage}% posiciona ${firstName} entre os colaboradores de maior progresso no time.`] : []),
      ...(goodItems.length === 0 ? ['Progresso em construção. Primeiros marcos de competência sendo estabelecidos.'] : []),
    ],

    recomendacoes: [
      m.pdiAverage < 50
        ? `Agendar 1:1 estruturado para mapear obstáculos em "${lateItems[0]?.treinamento_nome || m.pdiGoal || 'seu PDI'}" com pauta e registro formal.`
        : `Validar formalmente o marco de "${topTraining?.treinamento_nome || m.pdiGoal || 'seu PDI'}" no sistema e documentar as evidências observadas.`,
      lateItems.length > 0
        ? `Propor plano de recuperação de 30 dias para "${lateItems[0].treinamento_nome}" com metas semanais mensuráveis.`
        : `Considerar uma trilha de nível superior para manter o engajamento e acelerar o crescimento.`,
      goodItems.length > 0
        ? `Reconhecer formalmente o avanço em "${goodItems[0].treinamento_nome}" no próximo ciclo de feedback da equipe.`
        : `Definir junto com ${firstName} metas mais granulares e mensuráveis para os próximos 45 dias.`,
    ],

    proximoPasso:
      m.pdiAverage < 50
        ? `Agendar 1:1 focado nos bloqueadores de "${lateItems[0]?.treinamento_nome || m.pdiGoal || 'seu PDI'}" nos próximos 7 dias. Revisar se o objetivo do PDI ainda é aderente ao contexto atual da área.`
        : m.pdiAverage < 70
        ? `Validar o marco de "${topTraining?.treinamento_nome || m.pdiGoal || 'seu PDI'}" e entregar feedback escrito sobre a aplicação prática. Propor um desafio complementar de 2 semanas.`
        : `Reconhecer o desempenho de ${firstName} e propor elevação de complexidade nos objetivos do próximo ciclo do PDI.`,

    projecao:
      m.pdiAverage >= 80
        ? `Com o ritmo atual, ${firstName} tem perfil para atingir excelência no PDI vigente até o fim do trimestre. Elegível para expansão de responsabilidades e mentoria de pares.`
        : m.pdiAverage >= 60
        ? `Mantendo a cadência, ${firstName} deve concluir os objetivos principais dentro do prazo. Uma revisão de meio de ciclo é recomendada para recalibrar as metas.`
        : `O ritmo atual exige intervenção estruturada. Sem ajuste no plano, há risco concreto de não cumprimento dos objetivos do PDI no ciclo vigente.`,
  };
};

const FeedbackManagement: React.FC<{ managerId: string }> = ({ managerId }) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [selectedCollab, setSelectedCollab] = useState<Collaborator | null>(null);
  const [isCollabLoading, setIsCollabLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  // PDI Progress Filter State for Left Column Dashboard
  const [pdiProgressFilter, setPdiProgressFilter] = useState<'high' | 'medium' | 'low' | null>(null);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string | null>(null);

  // New Feedback Form State
  const [newFeedbackContent, setNewFeedbackContent] = useState('');
  const [newFeedbackType, setNewFeedbackType] = useState<'Positivo' | 'Desenvolvimento' | 'Construtivo'>('Positivo');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  // Helper for categorizing PDI % progress
  const getPdiCategory = (avg: number): 'high' | 'medium' | 'low' => {
    if (avg >= 75) return 'high';
    if (avg >= 50) return 'medium';
    return 'low';
  };

  const highPdiCollabs = collaborators.filter(c => getPdiCategory(c.pdiAverage) === 'high');
  const mediumPdiCollabs = collaborators.filter(c => getPdiCategory(c.pdiAverage) === 'medium');
  const lowPdiCollabs = collaborators.filter(c => getPdiCategory(c.pdiAverage) === 'low');

  // Filtered members in selected category group
  const membersInSelectedCategory = React.useMemo(() => {
    if (!pdiProgressFilter) return [];
    return collaborators.filter(c => getPdiCategory(c.pdiAverage) === pdiProgressFilter);
  }, [collaborators, pdiProgressFilter]);

  // Grouped roles with average PDI progress
  const rolesInSelectedCategory = React.useMemo(() => {
    if (!pdiProgressFilter) return [];
    const groups: { [key: string]: { roleName: string; members: Collaborator[]; avgProgress: number } } = {};
    membersInSelectedCategory.forEach(c => {
      const rName = c.role || 'Não Definido';
      if (!groups[rName]) {
        groups[rName] = { roleName: rName, members: [], avgProgress: 0 };
      }
      groups[rName].members.push(c);
    });

    Object.values(groups).forEach(item => {
      const sum = item.members.reduce((acc, curr) => acc + (curr.pdiAverage || 0), 0);
      item.avgProgress = Math.round(sum / item.members.length);
    });

    return Object.values(groups);
  }, [membersInSelectedCategory, pdiProgressFilter]);

  const handleFilterClick = (cat: 'high' | 'medium' | 'low') => {
    setPdiProgressFilter(pdiProgressFilter === cat ? null : cat);
  };

  // New Meeting Form State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedMeetingCollabId, setSelectedMeetingCollabId] = useState<string>('');
  const [newMeetingDate, setNewMeetingDate] = useState('');
  const [newMeetingTime, setNewMeetingTime] = useState('');
  const [newMeetingType, setNewMeetingType] = useState('1:1');
  const [newMeetingObs, setNewMeetingObs] = useState('');
  const [isSchedulingMeeting, setIsSchedulingMeeting] = useState(false);

  // Success message toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchCollaborators();
    fetchManagerMeetings();
  }, [managerId]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const fetchCollaborators = async () => {
    try {
      const response = await api.get(`/api/team?managerId=${managerId}`);
      // Filter out manager from selection
      const filtered = response.data.filter((c: any) => !c.role.toLowerCase().includes('gestor'));
      setCollaborators(filtered);
    } catch (error) {
      console.error("Failed to load collaborators", error);
    }
  };

  const fetchManagerMeetings = async () => {
    try {
      const meetingsRes = await api.get(`/api/meetings?managerId=${managerId}`);
      setMeetings(meetingsRes.data);
    } catch (error) {
      console.error("Failed to fetch meetings for manager", error);
    }
  };

  const handleOpenCollabDetail = async (collab: Collaborator) => {
    setSelectedCollab(collab);
    setIsCollabLoading(true);
    setNewFeedbackContent('');
    setNewFeedbackType('Positivo');
    try {
      const fbRes = await api.get(`/api/feedbacks?collabId=${collab.id}`);
      setFeedbacks(fbRes.data);
    } catch (err) {
      console.error("Failed to fetch feedbacks for collab", err);
    } finally {
      setIsCollabLoading(false);
    }
  };

  // Helper trigger
  if (false as boolean) { handleOpenCollabDetail(collaborators[0]); }

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedbackContent.trim() || !selectedCollab) return;

    setIsSendingFeedback(true);
    try {
      await api.post('/api/feedbacks', {
        id_colaborador: selectedCollab.id,
        gestor_id: managerId,
        tipo: newFeedbackType,
        conteudo: newFeedbackContent.trim()
      });
      setNewFeedbackContent('');
      showToast("Feedback enviado e registrado com sucesso!");
      
      // Refresh feedbacks list in the modal
      const fbRes = await api.get(`/api/feedbacks?collabId=${selectedCollab.id}`);
      setFeedbacks(fbRes.data);
    } catch (error) {
      console.error("Failed to save feedback", error);
      showToast("Erro ao salvar feedback. Tente novamente.");
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetCollabId = selectedMeetingCollabId || (collaborators[0]?.id);
    if (!newMeetingDate || !newMeetingTime || !targetCollabId) return;

    setIsSchedulingMeeting(true);
    try {
      await api.post('/api/meetings', {
        id_colaborador: targetCollabId,
        gestor_id: managerId,
        data: newMeetingDate,
        hora: newMeetingTime,
        tipo: newMeetingType,
        observacoes: newMeetingObs
      });

      setNewMeetingDate('');
      setNewMeetingTime('');
      setNewMeetingType('1:1');
      setNewMeetingObs('');
      setSelectedMeetingCollabId('');
      setShowScheduleModal(false);
      showToast("Reunião agendada com sucesso!");
      fetchManagerMeetings();
    } catch (error) {
      console.error("Failed to schedule meeting", error);
      showToast("Erro ao agendar reunião.");
    } finally {
      setIsSchedulingMeeting(false);
    }
  };

  const handleUpdateMeetingStatus = async (meetingId: number, status: 'Realizado' | 'Cancelado') => {
    try {
      await api.patch(`/api/meetings/${meetingId}`, { status });
      showToast(`Status da reunião atualizado para ${status === 'Realizado' ? 'Concluída' : 'Cancelada'}!`);
      fetchManagerMeetings();
    } catch (error) {
      console.error("Failed to update meeting status", error);
    }
  };

  const getCollabForMeeting = (collabId: string) => {
    return collaborators.find(c => String(c.id) === String(collabId));
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('pt-BR');
    } catch (e) {
      return isoString;
    }
  };

  const getFeedbackBadgeColor = (type: string) => {
    switch (type) {
      case 'Positivo':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Desenvolvimento':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Construtivo':
        return 'bg-red-50 text-red-700 border-red-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-navy-800 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-gray-800 z-50 animate-in fade-in slide-in-from-bottom-5">
          <Sparkles className="w-5 h-5 text-primary-400 shrink-0" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header View */}
      <div id="tour-feedback-section" className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Feedbacks e 1:1</h1>
          <p className="text-gray-500 mt-2 text-sm font-medium">Gerencie e envie feedbacks para o seu time e acompanhe os próximos encontros.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (span 2): Independently scrollable container for Donut + Hierarchical Org Chart */}
        <div className="lg:col-span-2 space-y-6 max-h-[calc(100vh-140px)] overflow-y-auto pr-1">
          {/* Micro-Dashboard: Donut Chart + Pill Toggles */}
          <div id="tour-feedback-donut-card" className="bg-white border border-gray-100 shadow-md rounded-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-50 pb-4">
              <div>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#1E4382]" />
                  Acompanhamento de Progresso do PDI da Equipe
                </h3>
                <p className="text-gray-400 text-xs font-medium mt-0.5">
                  Filtre a estrutura do time por % de progresso do PDI para agendar reuniões 1:1.
                </p>
              </div>
              <span className="text-xs font-bold text-[#1E4382] bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 self-start sm:self-auto">
                💡 Gestão de 1:1
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
              {/* Centered Donut Chart Visual (5 cols) */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center relative py-2">
                <div className="relative w-60 h-60 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background Ring */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#f3f4f6"
                      strokeWidth="12"
                      fill="transparent"
                    />

                    {/* Proportional Slices */}
                    {(() => {
                      const strokeWidth = 12;
                      const radius = 38;
                      const circumference = 2 * Math.PI * radius; // ~238.76

                      const countHigh = highPdiCollabs.length;
                      const countMed = mediumPdiCollabs.length;
                      const countLow = lowPdiCollabs.length;
                      const totalSum = countHigh + countMed + countLow || collaborators.length || 1;

                      const pctHigh = countHigh / totalSum;
                      const pctMed = countMed / totalSum;
                      const pctLow = countLow / totalSum;

                      const gap = totalSum > 0 ? 1.5 : 0;
                      const lenHigh = Math.max(0, pctHigh * circumference - gap);
                      const lenMed = Math.max(0, pctMed * circumference - gap);
                      const lenLow = Math.max(0, pctLow * circumference - gap);

                      const offHigh = 0;
                      const offMed = -(pctHigh * circumference);
                      const offLow = -((pctHigh + pctMed) * circumference);

                      const isHighSelected = pdiProgressFilter === 'high';
                      const isMedSelected = pdiProgressFilter === 'medium';
                      const isLowSelected = pdiProgressFilter === 'low';
                      const noSelection = pdiProgressFilter === null;

                      return (
                        <>
                          {/* Segment 1: High (Green >=75%) */}
                          {lenHigh > 0 && (
                            <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              stroke="#10b981"
                              strokeWidth={isHighSelected ? strokeWidth + 2 : strokeWidth}
                              strokeDasharray={`${lenHigh} ${circumference - lenHigh}`}
                              strokeDashoffset={offHigh}
                              fill="transparent"
                              className={`transition-all duration-500 cursor-pointer ${
                                isHighSelected ? 'drop-shadow-[0_0_12px_rgba(16,185,129,0.5)] opacity-100' : noSelection ? 'opacity-90 hover:opacity-100' : 'opacity-40 hover:opacity-80'
                              }`}
                              onClick={() => handleFilterClick('high')}
                            />
                          )}

                          {/* Segment 2: Medium (Orange/Amber 50-74%) */}
                          {lenMed > 0 && (
                            <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              stroke="#f59e0b"
                              strokeWidth={isMedSelected ? strokeWidth + 2 : strokeWidth}
                              strokeDasharray={`${lenMed} ${circumference - lenMed}`}
                              strokeDashoffset={offMed}
                              fill="transparent"
                              className={`transition-all duration-500 cursor-pointer ${
                                isMedSelected ? 'drop-shadow-[0_0_12px_rgba(245,158,11,0.5)] opacity-100' : noSelection ? 'opacity-90 hover:opacity-100' : 'opacity-40 hover:opacity-80'
                              }`}
                              onClick={() => handleFilterClick('medium')}
                            />
                          )}

                          {/* Segment 3: Low (Red <50%) */}
                          {lenLow > 0 && (
                            <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              stroke="#ef4444"
                              strokeWidth={isLowSelected ? strokeWidth + 2 : strokeWidth}
                              strokeDasharray={`${lenLow} ${circumference - lenLow}`}
                              strokeDashoffset={offLow}
                              fill="transparent"
                              className={`transition-all duration-500 cursor-pointer ${
                                isLowSelected ? 'drop-shadow-[0_0_12px_rgba(239,68,68,0.5)] opacity-100' : noSelection ? 'opacity-90 hover:opacity-100' : 'opacity-40 hover:opacity-80'
                              }`}
                              onClick={() => handleFilterClick('low')}
                            />
                          )}
                        </>
                      );
                    })()}
                  </svg>

                  {/* Center Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2">
                    <span className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                      {collaborators.length}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 mt-1 max-w-[110px] leading-tight">
                      Membros do Time
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive Pill Toggles (7 cols - Vertical Stack) */}
              <div className="lg:col-span-7 space-y-3">
                {/* Pill 1: Avançado / No Prazo (Green) */}
                <div
                  onClick={() => handleFilterClick('high')}
                  className={`p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 ${
                    pdiProgressFilter === 'high'
                      ? 'bg-emerald-50/90 border-emerald-300 shadow-[0_4px_20px_rgba(16,185,129,0.18)] scale-[1.01]'
                      : 'bg-emerald-50/30 hover:bg-emerald-50/70 border-emerald-100 text-gray-700 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center font-black shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                          AVANÇADO / NO PRAZO
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 block mt-0.5">
                        Progresso do PDI &ge; 75%
                      </span>
                    </div>
                  </div>
                  <span className="text-base font-black text-emerald-900 bg-emerald-100/80 px-2.5 py-0.5 rounded-full shrink-0">
                    {highPdiCollabs.length}
                  </span>
                </div>

                {/* Pill 2: Em Andamento / Atenção (Orange/Amber) */}
                <div
                  onClick={() => handleFilterClick('medium')}
                  className={`p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 ${
                    pdiProgressFilter === 'medium'
                      ? 'bg-amber-50/90 border-amber-300 shadow-[0_4px_20px_rgba(245,158,11,0.18)] scale-[1.01]'
                      : 'bg-amber-50/30 hover:bg-amber-50/70 border-amber-100 text-gray-700 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center font-black shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                          EM ANDAMENTO / ATENÇÃO
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-amber-700 block mt-0.5">
                        Progresso do PDI entre 50% e 74%
                      </span>
                    </div>
                  </div>
                  <span className="text-base font-black text-amber-900 bg-amber-100/80 px-2.5 py-0.5 rounded-full shrink-0">
                    {mediumPdiCollabs.length}
                  </span>
                </div>

                {/* Pill 3: Baixo Engajamento / Crítico (Red) */}
                <div
                  onClick={() => handleFilterClick('low')}
                  className={`p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 ${
                    pdiProgressFilter === 'low'
                      ? 'bg-rose-50/90 border-rose-300 shadow-[0_4px_20px_rgba(239,68,68,0.18)] scale-[1.01]'
                      : 'bg-rose-50/30 hover:bg-rose-50/70 border-rose-100 text-gray-700 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center font-black shrink-0">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-rose-950 uppercase tracking-wider">
                          BAIXO ENGAJAMENTO / CRÍTICO
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-rose-700 block mt-0.5">
                        Progresso do PDI &lt; 50%
                      </span>
                    </div>
                  </div>
                  <span className="text-base font-black text-rose-900 bg-rose-100/80 px-2.5 py-0.5 rounded-full shrink-0">
                    {lowPdiCollabs.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Hierarchical Role Org-Chart Visualizer Layer */}
          {pdiProgressFilter === null ? (
            <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white border border-blue-100/80 p-8 rounded-2xl text-center space-y-3 shadow-sm animate-in fade-in duration-300">
              <div className="w-12 h-12 rounded-2xl bg-white border border-blue-100 text-[#1E4382] flex items-center justify-center mx-auto shadow-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-gray-900">Selecione uma faixa de PDI no gráfico acima</h3>
              <p className="text-gray-500 text-xs font-medium max-w-md mx-auto leading-relaxed">
                Clique em 🟢 <strong>Avançado</strong>, 🟡 <strong>Em Andamento</strong> ou 🔴 <strong>Crítico</strong> no micro-dashboard para explorar os cargos e colaboradores.
              </p>
              <button
                onClick={() => setPdiProgressFilter('high')}
                className="mt-2 inline-flex items-center gap-2 text-xs font-extrabold text-[#1E4382] bg-white border border-blue-200 px-4 py-2.5 rounded-xl hover:bg-blue-50 transition-all shadow-sm active:scale-95"
              >
                <span>Explorar grupo Avançado ({highPdiCollabs.length} pessoas)</span>
              </button>
            </div>

          /* Layer 2: Role Selection inside PDI Group */
          ) : pdiProgressFilter !== null && selectedRoleFilter === null ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Header Bar */}
              <div className="flex justify-between items-center bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPdiProgressFilter(null)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar ao Visão Geral
                  </button>
                  <span className="text-xs font-black text-gray-950 uppercase tracking-wider">
                    Faixa PDI: {pdiProgressFilter === 'high' ? '🟢 Avançado (>=75%)' : pdiProgressFilter === 'medium' ? '🟡 Em Andamento (50-74%)' : '🔴 Crítico (<50%)'}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedRoleFilter('ALL')}
                  className="text-xs font-extrabold text-[#1E4382] hover:underline bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100"
                >
                  Ver todos os colaboradores da faixa ({membersInSelectedCategory.length}) →
                </button>
              </div>

              {/* Hierarchy Tree Visualizer */}
              <HierarchicalRoleOrgChart
                rolesData={rolesInSelectedCategory.map(r => ({
                  roleName: r.roleName,
                  members: r.members as any,
                  avgProgress: r.avgProgress,
                  levelRank: 0
                }))}
                metricsLabel="MÉDIA DE PDI"
                actionColorTheme="blue"
                actionLabelGenerator={(rName) => `Ver Pessoas em ${rName}`}
                onSelectRole={(rName) => setSelectedRoleFilter(rName)}
              />
            </div>

          /* Layer 3: Selected Role -> Collaborators List with Feedback / 1:1 Action Buttons */
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-white border border-gray-100 shadow-sm p-4 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedRoleFilter(null)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all border border-gray-200 flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar aos Cargos
                  </button>
                  <span className="text-xs font-black text-[#1E4382] bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-xl">
                    Cargo: {selectedRoleFilter === 'ALL' ? 'Todos os Cargos' : selectedRoleFilter}
                  </span>
                </div>

                <span className="text-xs font-bold text-gray-400">
                  {membersInSelectedCategory.filter(c => selectedRoleFilter === 'ALL' || c.role === selectedRoleFilter).length} pessoa(s)
                </span>
              </div>

              {/* Collaborator Cards Grid inside Role */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {membersInSelectedCategory
                  .filter(c => selectedRoleFilter === 'ALL' || c.role === selectedRoleFilter)
                  .map(c => (
                    <div
                      key={c.id}
                      className="bg-white border border-gray-100 hover:border-blue-200 shadow-md rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between group"
                    >
                      <div>
                        <div
                          onClick={() => handleOpenCollabDetail(c)}
                          className="flex items-center gap-4 cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-50 border-2 border-white shadow-sm shrink-0 group-hover:ring-2 ring-[#1E4382] transition-all">
                            <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-black text-gray-900 text-sm group-hover:text-[#1E4382] transition-colors truncate">{c.name}</h4>
                            <p className="text-gray-500 text-xs font-semibold mt-0.5 truncate">{c.role}</p>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs">
                          <span className="text-[10px] font-bold text-gray-400">Progresso do PDI:</span>
                          <span className="font-black text-[#1E4382] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{c.pdiAverage}%</span>
                        </div>
                      </div>

                      {/* Action Footer Buttons */}
                      <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleOpenCollabDetail(c)}
                          className="w-full flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs py-2 px-3 rounded-xl transition-all active:scale-95"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Feedback</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMeetingCollabId(c.id);
                            setShowScheduleModal(true);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 bg-[#1E4382] hover:bg-blue-900 text-white font-extrabold text-xs py-2 px-3 rounded-xl shadow-sm transition-all active:scale-95"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Agendar 1:1</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Meetings */}
        <div className="space-y-6">
          {/* Schedule 1:1 meetings card */}
          <div className="bg-white border border-gray-100 shadow-md rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-600" />
                Próximos Encontros
              </h3>

              <button
                onClick={() => {
                  setSelectedMeetingCollabId(collaborators[0]?.id || '');
                  setShowScheduleModal(true);
                }}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-50 text-primary-600 border border-primary-100 hover:bg-primary-100 transition-all active:scale-95 cursor-pointer"
                title="Agendar nova reunião"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {meetings.filter(m => m.status === 'Agendado').length === 0 ? (
              <div className="border border-dashed border-gray-100 rounded-xl p-6 text-center text-gray-400 text-xs">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-35" />
                <p className="font-bold">Nenhum encontro agendado.</p>
                <button
                  onClick={() => {
                    setSelectedMeetingCollabId(collaborators[0]?.id || '');
                    setShowScheduleModal(true);
                  }}
                  className="text-primary-600 hover:underline mt-2 font-bold block mx-auto text-[11px]"
                >
                  Agendar 1:1 Agora
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {meetings
                  .filter(m => m.status === 'Agendado')
                  .map(meeting => {
                    const collab = getCollabForMeeting(meeting.id_colaborador);
                    return (
                      <div key={meeting.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[9px] font-black bg-primary-50 border border-primary-100 text-primary-600 px-2 py-0.5 rounded uppercase tracking-wider">
                              {meeting.tipo}
                            </span>
                            {collab && (
                              <div className="flex items-center gap-2 mt-2">
                                <img src={collab.avatar} alt={collab.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
                                <span className="text-xs font-bold text-gray-700 truncate">{collab.name}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500 font-semibold">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              <span>{formatDate(meeting.data)} às {meeting.hora}</span>
                            </div>
                          </div>

                          {/* Meeting Action Controls */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleUpdateMeetingStatus(meeting.id, 'Realizado')}
                              className="w-6.5 h-6.5 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-600 flex items-center justify-center transition-all cursor-pointer"
                              title="Marcar como realizada"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleUpdateMeetingStatus(meeting.id, 'Cancelado')}
                              className="w-6.5 h-6.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 flex items-center justify-center transition-all cursor-pointer"
                              title="Cancelar reunião"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {meeting.observacoes && (
                          <p className="text-gray-500 text-[11px] font-medium leading-relaxed bg-white border border-gray-100 p-2 rounded-lg">
                            {meeting.observacoes}
                          </p>
                        )}

                        <a
                          href={meeting.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[10px] font-bold text-primary-600 hover:text-primary-700 bg-white border border-gray-100/80 px-2.5 py-1.5 rounded-lg w-fit transition-all shadow-sm"
                        >
                          <LinkIcon className="w-3 h-3" />
                          Entrar na Sala Virtual
                        </a>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* History of Past Meetings */}
          <div className="bg-white border border-gray-100 shadow-md rounded-2xl p-6">
            <h3 className="text-base font-black text-gray-900 flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Histórico de Reuniões
            </h3>

            {meetings.filter(m => m.status !== 'Agendado').length === 0 ? (
              <p className="text-gray-400 text-xs font-bold text-center py-4">Sem reuniões passadas concluídas neste ciclo.</p>
            ) : (
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {meetings
                  .filter(m => m.status !== 'Agendado')
                  .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                  .slice(0, 5)
                  .map(meeting => {
                    const collab = getCollabForMeeting(meeting.id_colaborador);
                    return (
                      <div key={meeting.id} className="flex justify-between items-center text-xs border-b border-gray-50 pb-2.5 last:border-b-0 last:pb-0 gap-4">
                        <div className="min-w-0">
                          <p className="text-gray-900 font-bold truncate">{meeting.tipo}</p>
                          <p className="text-gray-500 font-semibold text-[10px] truncate">{collab?.name || 'Colaborador'}</p>
                          <p className="text-gray-400 font-medium text-[9px] mt-0.5">Em {formatDate(meeting.data)}</p>
                        </div>

                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${meeting.status === 'Realizado'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                          }`}>
                          {meeting.status === 'Realizado' ? 'Concluída' : 'Cancelada'}
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collaborator Detail Modal */}
      {selectedCollab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => setSelectedCollab(null)}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-2xl animate-in zoom-in-95 duration-200 z-10">
            {/* Header */}
            <div className="shrink-0 bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950 px-6 py-5 relative overflow-hidden flex justify-between items-center">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-3xl rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/10 blur-3xl rounded-full pointer-events-none" />

              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white/20 shrink-0">
                  <img src={selectedCollab.avatar} alt={selectedCollab.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-black text-white leading-tight">{selectedCollab.name}</h2>
                  <p className="text-gray-400 text-xs mt-0.5">{selectedCollab.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 relative z-10">
                <div className="text-right bg-white/10 border border-white/10 rounded-xl px-3 py-1.5 shrink-0">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider block">Média PDI</span>
                  <span className="text-sm font-black text-white">{selectedCollab.pdiAverage}%</span>
                </div>
                <button
                  onClick={() => setSelectedCollab(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 space-y-6">
              {isCollabLoading ? (
                <div className="space-y-6 animate-pulse">
                  <div className="h-24 bg-white rounded-2xl border border-gray-100"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-48 bg-white rounded-2xl border border-gray-100"></div>
                    <div className="h-48 bg-white rounded-2xl border border-gray-100"></div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                    {/* Left side: Trainings and Skills (span 2) */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Trainings/Courses list */}
                      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
                          <Target className="w-4 h-4 text-primary-600" />
                          <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Treinamentos e PDI</h3>
                        </div>

                        {selectedCollab.pdiHistory && selectedCollab.pdiHistory.length > 0 ? (
                          <div className="space-y-3.5">
                            {selectedCollab.pdiHistory.map((item, idx) => {
                              const scoreColor = item.score >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                                                 item.score >= 60 ? 'text-primary-600 bg-primary-50 border-primary-100' :
                                                 'text-amber-600 bg-amber-50 border-amber-100';
                              return (
                                <div key={idx} className="border border-gray-100 rounded-xl p-3 bg-gray-50/20 space-y-2">
                                  <div className="flex justify-between items-start gap-2">
                                    <span className="font-bold text-xs text-gray-800 leading-tight">{item.treinamento_nome}</span>
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${scoreColor}`}>{item.score}%</span>
                                  </div>
                                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-primary-600" style={{ width: `${item.score}%` }}></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-gray-400 text-xs italic">Nenhum treinamento registrado.</p>
                        )}
                      </div>

                      {/* Skills/Competencies list */}
                      {selectedCollab.skills && selectedCollab.skills.length > 0 && (
                        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 space-y-3">
                          <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Competências Mapeadas</h3>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedCollab.skills.map((skill, i) => (
                              <span key={i} className="text-[10px] font-bold bg-gray-50 border border-gray-200 text-gray-700 px-2 py-1 rounded-lg">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right side: AI Analysis and Feedback History (span 3) */}
                    <div className="lg:col-span-3 space-y-6">
                      {/* AI Analysis Summary */}
                      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Diagnóstico da IA</h3>
                        </div>

                        {(() => {
                          const analysis = generateAnalysis(selectedCollab);
                          return (
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Situação Atual</h4>
                                <p className="text-xs text-gray-600 leading-relaxed font-medium">{analysis.momentoAtual}</p>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="bg-rose-50/30 border border-rose-100/50 rounded-xl p-3.5">
                                  <h4 className="text-[9px] font-black text-rose-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 text-rose-500" /> Pontos de Atenção
                                  </h4>
                                  <ul className="space-y-1.5">
                                    {analysis.pontosAtencao.map((pt, i) => (
                                      <li key={i} className="text-[11px] text-gray-600 leading-relaxed list-disc list-inside">{pt}</li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="bg-emerald-50/30 border border-emerald-100/50 rounded-xl p-3.5">
                                  <h4 className="text-[9px] font-black text-emerald-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <ThumbsUp className="w-3 h-3 text-emerald-500" /> Destaques
                                  </h4>
                                  <ul className="space-y-1.5">
                                    {analysis.destaques.map((pt, i) => (
                                      <li key={i} className="text-[11px] text-gray-600 leading-relaxed list-disc list-inside">{pt}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Feedback History */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-gray-400" /> Histórico de Feedbacks
                        </h3>

                        {feedbacks.length === 0 ? (
                          <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-6 text-center text-gray-400">
                            <p className="text-xs font-bold">Nenhum feedback enviado neste ciclo.</p>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                            {feedbacks.map(fb => (
                              <div key={fb.id} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm space-y-2">
                                <div className="flex justify-between items-center gap-2">
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 border rounded ${getFeedbackBadgeColor(fb.tipo)}`}>
                                    {fb.tipo}
                                  </span>
                                  <span className="text-[9px] font-bold text-gray-400">{formatDate(fb.data)}</span>
                                </div>
                                <p className="text-xs text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">{fb.conteudo}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Add Feedback Form section (At the bottom of modal) */}
                  <div className="border-t border-gray-100 pt-5 space-y-4">
                    <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary-600" />
                      Registrar Novo Feedback
                    </h3>

                    <form onSubmit={handleSendFeedback} className="space-y-4 bg-white border border-gray-100 shadow-sm p-4 rounded-2xl">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                          Tipo de Feedback
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {(['Positivo', 'Desenvolvimento', 'Construtivo'] as const).map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setNewFeedbackType(type)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${newFeedbackType === type
                                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                              {type === 'Positivo' && <ThumbsUp className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
                              {type === 'Desenvolvimento' && <Sparkles className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
                              {type === 'Construtivo' && <AlertCircle className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="modal-feedback-content" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          Mensagem
                        </label>
                        <textarea
                          id="modal-feedback-content"
                          value={newFeedbackContent}
                          onChange={(e) => setNewFeedbackContent(e.target.value)}
                          placeholder={`Escreva aqui o feedback estruturado para ${selectedCollab.name.split(' ')[0]}...`}
                          rows={3}
                          className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-600/10 focus:border-primary-600 transition-all text-xs text-gray-700 font-medium placeholder-gray-400 resize-none shadow-sm"
                          required
                        ></textarea>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isSendingFeedback || !newFeedbackContent.trim()}
                          className="btn-primary flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs py-2 px-4 rounded-xl"
                        >
                          {isSendingFeedback ? 'Enviando...' : 'Registrar Feedback'}
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white border border-gray-100 rounded-2xl max-w-md w-full shadow-2xl p-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowScheduleModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-primary-600" />
              Agendar Nova Conversa / 1:1
            </h3>

            <form onSubmit={handleScheduleMeeting} className="space-y-4">
              <div>
                <label htmlFor="meeting-collab" className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  Colaborador
                </label>
                <select
                  id="meeting-collab"
                  value={selectedMeetingCollabId}
                  onChange={(e) => setSelectedMeetingCollabId(e.target.value)}
                  className="w-full bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-600/10 focus:border-primary-600 shadow-sm"
                  required
                >
                  <option value="" disabled>Selecione um colaborador...</option>
                  {collaborators.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="meeting-type" className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  Tipo de Reunião
                </label>
                <select
                  id="meeting-type"
                  value={newMeetingType}
                  onChange={(e) => setNewMeetingType(e.target.value)}
                  className="w-full bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-600/10 focus:border-primary-600 shadow-sm"
                >
                  <option value="1:1">Conversa 1:1</option>
                  <option value="Revisão de PDI">Revisão de PDI</option>
                  <option value="Avaliação de Desempenho">Avaliação de Desempenho</option>
                  <option value="Acompanhamento">Acompanhamento e Feedback</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="meeting-date" className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Data
                  </label>
                  <input
                    id="meeting-date"
                    type="date"
                    value={newMeetingDate}
                    onChange={(e) => setNewMeetingDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-600/10 focus:border-primary-600 shadow-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="meeting-time" className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Hora
                  </label>
                  <input
                    id="meeting-time"
                    type="time"
                    value={newMeetingTime}
                    onChange={(e) => setNewMeetingTime(e.target.value)}
                    className="w-full bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-600/10 focus:border-primary-600 shadow-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="meeting-obs" className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  Observações / Pauta (Opcional)
                </label>
                <textarea
                  id="meeting-obs"
                  value={newMeetingObs}
                  onChange={(e) => setNewMeetingObs(e.target.value)}
                  placeholder="Defina brevemente os tópicos centrais da conversa..."
                  rows={3}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-600/10 focus:border-primary-600 transition-all text-sm text-gray-700 font-medium placeholder-gray-400 resize-none shadow-sm"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSchedulingMeeting}
                  className="btn-primary cursor-pointer disabled:opacity-50"
                >
                  {isSchedulingMeeting ? 'Agendando...' : 'Confirmar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackManagement;
