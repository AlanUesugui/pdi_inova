import React, { useState, useEffect } from 'react';
import {
  MessageSquare, Calendar, Plus, Check, X, Sparkles, Clock,
  User, CheckCircle2, AlertCircle, ThumbsUp, ArrowUpRight, Link as LinkIcon,
  Target
} from 'lucide-react';
import api from '../utils/api';

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
  const [searchCollab, setSearchCollab] = useState('');
  const [selectedCollab, setSelectedCollab] = useState<Collaborator | null>(null);
  const [isCollabLoading, setIsCollabLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Feedback Form State
  const [newFeedbackContent, setNewFeedbackContent] = useState('');
  const [newFeedbackType, setNewFeedbackType] = useState<'Positivo' | 'Desenvolvimento' | 'Construtivo'>('Positivo');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

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
      setIsLoading(true);
      const response = await api.get(`/api/team?managerId=${managerId}`);
      // Filter out manager from selection
      const filtered = response.data.filter((c: any) => !c.role.toLowerCase().includes('gestor'));
      setCollaborators(filtered);
    } catch (error) {
      console.error("Failed to load collaborators", error);
    } finally {
      setIsLoading(false);
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

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'Healthy':
        return { text: "No Caminho", class: "bg-emerald-50 text-emerald-600 border-emerald-100" };
      case 'Attention':
        return { text: "Atenção", class: "bg-amber-50 text-amber-600 border-amber-100" };
      default:
        return { text: "Em Risco", class: "bg-rose-50 text-rose-600 border-rose-100" };
    }
  };

  const filteredCollaborators = collaborators.filter(c =>
    c.name.toLowerCase().includes(searchCollab.toLowerCase()) ||
    c.role.toLowerCase().includes(searchCollab.toLowerCase())
  );

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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Feedbacks e 1:1</h1>
          <p className="text-gray-500 mt-2 text-sm font-medium">Gerencie e envie feedbacks para o seu time e acompanhe os próximos encontros.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (span 2): Collaborators List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-100 shadow-md rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-600" />
                Membros do Time
              </h3>
              <input
                type="text"
                value={searchCollab}
                onChange={(e) => setSearchCollab(e.target.value)}
                placeholder="Buscar por nome ou cargo..."
                className="px-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600/10 focus:border-primary-600 font-medium w-full sm:w-64"
              />
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="h-32 bg-gray-100 animate-pulse rounded-2xl"></div>
                ))}
              </div>
            ) : filteredCollaborators.length === 0 ? (
              <p className="text-gray-400 text-sm font-medium text-center py-8">Nenhum colaborador encontrado.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCollaborators.map(c => (
                  <div
                    key={c.id}
                    onClick={() => handleOpenCollabDetail(c)}
                    className="bg-white border border-gray-100 hover:border-primary-200 hover:shadow-md rounded-2xl p-5 shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-50 border-2 border-white shadow-sm shrink-0">
                        <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-gray-900 text-sm group-hover:text-primary-600 transition-colors truncate">{c.name}</h4>
                        <p className="text-gray-500 text-xs font-semibold mt-0.5 truncate">{c.role}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-gray-50 flex items-center justify-between">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 border rounded ${getHealthBadge(c.aiHealth).class}`}>
                        {getHealthBadge(c.aiHealth).text}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400">PDI:</span>
                        <span className="text-xs font-black text-gray-700">{c.pdiAverage}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
