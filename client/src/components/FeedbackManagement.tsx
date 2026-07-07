import React, { useState, useEffect } from 'react';
import {
  MessageSquare, Calendar, Plus, Check, X, Sparkles, Clock,
  User, CheckCircle2, AlertCircle, ThumbsUp, ArrowUpRight, Link as LinkIcon
} from 'lucide-react';
import axios from 'axios';

interface Collaborator {
  id: string;
  name: string;
  role: string;
  avatar: string;
  aiHealth: 'Healthy' | 'Attention' | 'Risk';
  pdiAverage: number;
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

const FeedbackManagement: React.FC<{ managerId: string }> = ({ managerId }) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [selectedCollabId, setSelectedCollabId] = useState<string>('');
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Feedback Form State
  const [newFeedbackContent, setNewFeedbackContent] = useState('');
  const [newFeedbackType, setNewFeedbackType] = useState<'Positivo' | 'Desenvolvimento' | 'Construtivo'>('Positivo');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  // New Meeting Form State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newMeetingDate, setNewMeetingDate] = useState('');
  const [newMeetingTime, setNewMeetingTime] = useState('');
  const [newMeetingType, setNewMeetingType] = useState('1:1');
  const [newMeetingObs, setNewMeetingObs] = useState('');
  const [isSchedulingMeeting, setIsSchedulingMeeting] = useState(false);

  // Success message toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchCollaborators();
  }, [managerId]);

  useEffect(() => {
    if (selectedCollabId) {
      fetchFeedbacksAndMeetings(selectedCollabId);
    }
  }, [selectedCollabId]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const fetchCollaborators = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`http://localhost:3001/api/team?managerId=${managerId}`);
      // Filter out manager from selection
      const filtered = response.data.filter((c: any) => !c.role.toLowerCase().includes('gestor'));
      setCollaborators(filtered);
      if (filtered.length > 0) {
        setSelectedCollabId(filtered[0].id);
      }
    } catch (error) {
      console.error("Failed to load collaborators", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFeedbacksAndMeetings = async (collabId: string) => {
    try {
      const [feedbacksRes, meetingsRes] = await Promise.all([
        axios.get(`http://localhost:3001/api/feedbacks?collabId=${collabId}`),
        axios.get(`http://localhost:3001/api/meetings?collabId=${collabId}`)
      ]);
      setFeedbacks(feedbacksRes.data);
      setMeetings(meetingsRes.data);
    } catch (error) {
      console.error("Failed to fetch data for collaborator", error);
    }
  };

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedbackContent.trim() || !selectedCollabId) return;

    setIsSendingFeedback(true);
    try {
      await axios.post('http://localhost:3001/api/feedbacks', {
        id_colaborador: selectedCollabId,
        gestor_id: managerId,
        tipo: newFeedbackType,
        conteudo: newFeedbackContent.trim()
      });
      setNewFeedbackContent('');
      showToast("Feedback enviado e registrado com sucesso!");
      fetchFeedbacksAndMeetings(selectedCollabId);
    } catch (error) {
      console.error("Failed to save feedback", error);
      showToast("Erro ao salvar feedback. Tente novamente.");
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingDate || !newMeetingTime || !selectedCollabId) return;

    setIsSchedulingMeeting(true);
    try {
      await axios.post('http://localhost:3001/api/meetings', {
        id_colaborador: selectedCollabId,
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
      setShowScheduleModal(false);
      showToast("Reunião agendada com sucesso!");
      fetchFeedbacksAndMeetings(selectedCollabId);
    } catch (error) {
      console.error("Failed to schedule meeting", error);
      showToast("Erro ao agendar reunião.");
    } finally {
      setIsSchedulingMeeting(false);
    }
  };

  const handleUpdateMeetingStatus = async (meetingId: number, status: 'Realizado' | 'Cancelado') => {
    try {
      await axios.patch(`http://localhost:3001/api/meetings/${meetingId}`, { status });
      showToast(`Status da reunião atualizado para ${status === 'Realizado' ? 'Concluída' : 'Cancelada'}!`);
      fetchFeedbacksAndMeetings(selectedCollabId);
    } catch (error) {
      console.error("Failed to update meeting status", error);
    }
  };

  const getCollabInfo = () => {
    return collaborators.find(c => c.id === selectedCollabId);
  };

  const activeCollab = getCollabInfo();

  // Calculate statistics
  const totalFeedbacks = feedbacks.length;
  const upcomingMeeting = meetings.find(m => m.status === 'Agendado');
  const pastMeetingsCount = meetings.filter(m => m.status === 'Realizado').length;

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
          <p className="text-gray-500 mt-2 text-sm font-medium">Envie feedbacks e agende conversas com seus liderados.</p>
        </div>

        {/* Dropdown Collaborator Selection */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Colaborador:</label>
          {isLoading ? (
            <div className="h-10 w-48 bg-gray-200 animate-pulse rounded-xl"></div>
          ) : (
            <select
              value={selectedCollabId}
              onChange={(e) => setSelectedCollabId(e.target.value)}
              className="bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-600/10 focus:border-primary-600 shadow-sm"
            >
              {collaborators.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {activeCollab && (
        <>
          {/* Selected Collaborator Summary Header */}
          <div className="bg-white border border-gray-100 shadow-md rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img
                src={activeCollab.avatar}
                alt={activeCollab.name}
                className="w-16 h-16 rounded-full border-2 border-primary-100 object-cover"
              />
              <div>
                <h2 className="text-xl font-black text-gray-900">{activeCollab.name}</h2>
                <p className="text-gray-500 text-sm font-medium mt-0.5">{activeCollab.role}</p>

                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border rounded ${getHealthBadge(activeCollab.aiHealth).class}`}>
                    {getHealthBadge(activeCollab.aiHealth).text}
                  </span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
                    Média PDI: {activeCollab.pdiAverage}%
                  </span>
                </div>
              </div>
            </div>

            {/* Quick KPIs */}
            <div className="grid grid-cols-3 gap-8 md:gap-12 border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-12 w-full md:w-auto">
              <div className="text-center md:text-left">
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-wider">Feedbacks</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{totalFeedbacks}</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-wider">Próxima 1:1</p>
                <p className="text-sm font-black text-primary-600 mt-2 truncate max-w-[120px]">
                  {upcomingMeeting ? formatDate(upcomingMeeting.data) : 'Não agendada'}
                </p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-wider">1:1s Realizadas</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{pastMeetingsCount}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left/Middle Columns: Feedbacks Feed + Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Send New Feedback Card */}
              <div className="bg-white border border-gray-100 shadow-md rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary-600 to-purple-600"></div>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-primary-600" />
                  Enviar Novo Feedback
                </h3>

                <form onSubmit={handleSendFeedback} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                      Tipo de Feedback
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {(['Positivo', 'Desenvolvimento', 'Construtivo'] as const).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNewFeedbackType(type)}
                          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${newFeedbackType === type
                            ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                          {type === 'Positivo' && <ThumbsUp className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
                          {type === 'Desenvolvimento' && <Sparkles className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
                          {type === 'Construtivo' && <AlertCircle className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="feedback-content" className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                      Mensagem de Feedback
                    </label>
                    <textarea
                      id="feedback-content"
                      value={newFeedbackContent}
                      onChange={(e) => setNewFeedbackContent(e.target.value)}
                      placeholder={`Escreva aqui um feedback estruturado para ${activeCollab.name.split(' ')[0]}. Exemplo: descreva a situação, o comportamento observado e o impacto gerado...`}
                      rows={4}
                      className="w-full bg-white border border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary-600/10 focus:border-primary-600 transition-all text-sm text-gray-700 font-medium placeholder-gray-400 resize-none shadow-inner"
                      required
                    ></textarea>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSendingFeedback || !newFeedbackContent.trim()}
                      className="btn-primary flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSendingFeedback ? 'Enviando...' : 'Registrar Feedback'}
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>

              {/* Feedbacks History Feed */}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  Últimos Feedbacks Registrados
                </h3>

                {feedbacks.length === 0 ? (
                  <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-400">
                    <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-bold">Nenhum feedback registrado ainda para este ciclo.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedbacks
                      .filter((fb) => {
                        const dataFeedback = new Date(fb.data);
                        const dataHoje = new Date();
                        const trintaDiasAtras = new Date(dataHoje.setDate(dataHoje.getDate() - 30));
                        return dataFeedback >= trintaDiasAtras;
                      })
                      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                      .map(fb => (
                        <div key={fb.id} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 transition-all hover:shadow-md">
                          <div className="flex items-center justify-between gap-4 mb-3">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border rounded ${getFeedbackBadgeColor(fb.tipo)}`}>
                                {fb.tipo}
                              </span>
                              <span className="text-[10px] font-bold text-gray-400">
                                Em {formatDate(fb.data)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
                              <User className="w-3 h-3 text-gray-400" />
                              Por Gestor
                            </div>
                          </div>

                          <p className="text-gray-700 text-sm leading-relaxed font-medium whitespace-pre-wrap">
                            {fb.conteudo}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Meetings / 1:1 Schedule */}
            <div className="space-y-6">
              <div className="bg-white border border-gray-100 shadow-md rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary-600" />
                    Próximos Encontros
                  </h3>

                  <button
                    onClick={() => setShowScheduleModal(true)}
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
                      onClick={() => setShowScheduleModal(true)}
                      className="text-primary-600 hover:underline mt-2 font-bold block mx-auto text-[11px]"
                    >
                      Agendar 1:1 Agora
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {meetings
                      .filter(m => m.status === 'Agendado')
                      .map(meeting => (
                        <div key={meeting.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[9px] font-black bg-primary-50 border border-primary-100 text-primary-600 px-2 py-0.5 rounded uppercase tracking-wider">
                                {meeting.tipo}
                              </span>
                              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-900 font-bold">
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
                      ))}
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
                      .filter((m) => {
                        const dataMeeting = new Date(m.data);
                        const dataHoje = new Date();
                        const trintaDiasAtras = new Date(dataHoje.setDate(dataHoje.getDate() - 30));
                        return dataMeeting >= trintaDiasAtras;
                      })
                      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                      .filter(m => m.status !== 'Agendado')
                      .slice(0, 5)
                      .map(meeting => (
                        <div key={meeting.id} className="flex justify-between items-center text-xs border-b border-gray-50 pb-2.5 last:border-b-0 last:pb-0">
                          <div>
                            <p className="text-gray-900 font-bold">{meeting.tipo}</p>
                            <p className="text-gray-400 font-medium text-[10px] mt-0.5">Em {formatDate(meeting.data)}</p>
                          </div>

                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${meeting.status === 'Realizado'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                            }`}>
                            {meeting.status === 'Realizado' ? 'Concluída' : 'Cancelada'}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
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
