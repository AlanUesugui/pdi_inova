import React, { useState, useEffect } from 'react';
import { Eye, Zap, ChevronLeft, ChevronRight, Filter, Sparkles } from 'lucide-react';
import axios from 'axios';
import AIDrawer from './AIDrawer';
import TrainingHistoryModal, { type PDITraining } from './TrainingHistoryModal';
import CollaboratorAnalysisPanel from './CollaboratorAnalysisPanel';
import { getDynamicProgressColor } from '../utils/colors';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  level: string;
  pdiGoal: string;
  pdiAverage: number;
  pdiHistory: PDITraining[];
  aiHealth: 'Healthy' | 'Attention' | 'Risk';
  avatar: string;
  skills: string[];
}

const TeamManagement: React.FC<{ search: string, managerId: string }> = ({ search, managerId }) => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [filteredTeam, setFilteredTeam] = useState<TeamMember[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Toast State for validations
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Analysis Panel State
  const [analysisMember, setAnalysisMember] = useState<TeamMember | null>(null);

  // History Modal State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedMemberHistory, setSelectedMemberHistory] = useState<TeamMember | null>(null);

  useEffect(() => {
    fetchTeam();
  }, []);

  useEffect(() => {
    const filtered = team.filter(m =>
      !m.role.toLowerCase().includes('gestor') &&
      (m.name.toLowerCase().includes(search.toLowerCase()) ||
       m.role.toLowerCase().includes(search.toLowerCase()) ||
       m.skills.some(skill => skill.toLowerCase().includes(search.toLowerCase())))
    );
    setFilteredTeam(filtered);
  }, [search, team]);

  const fetchTeam = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/team?managerId=${managerId}`);
      setTeam(response.data);
      setFilteredTeam(response.data);
    } catch (error) {
      console.error("Failed to fetch team", error);
      const mockTeam: TeamMember[] = [
        {
          id: "1",
          name: "Ricardo Lopes",
          role: "DevOps Engineer Senior",
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
          level: "Pleno",
          pdiGoal: "Product Discovery Frameworks",
          pdiAverage: 82,
          pdiHistory: [
            { treinamento_nome: "Product Discovery Frameworks", score: 80, conhecimento: "Alto", aplicacao: "Alta", desempenho: "Destaque", eficacia: "Sim" },
            { treinamento_nome: "Comunicação com Stakeholders", score: 65, conhecimento: "Alto", aplicacao: "Media", desempenho: "Consistente", eficacia: "Sim" }
          ],
          aiHealth: "Healthy",
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

  const handleValidateMilestone = (name: string, pdiGoal: string) => {
    setToastMessage(`Marco de PDI "${pdiGoal}" de ${name} validado com sucesso!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const getStatusBadge = (avg: number) => {
    if (avg >= 85) return { text: "Acima da Média", class: "bg-purple-50 text-purple-600 border-purple-100" };
    if (avg >= 70) return { text: "On Track", class: "bg-emerald-50 text-emerald-600 border-emerald-100" };
    if (avg >= 50) return { text: "Em Progresso", class: "bg-amber-50 text-amber-600 border-amber-100" };
    return { text: "Em Atraso", class: "bg-rose-50 text-rose-600 border-rose-100" };
  };

  const getGoalStatusBadge = (score: number) => {
    if (score >= 90) return { text: "Concluído", class: "bg-emerald-50 text-emerald-600 border-emerald-100" };
    if (score >= 40) return { text: "Em andamento", class: "bg-amber-50 text-amber-600 border-amber-100" };
    return { text: "Não Iniciado", class: "bg-gray-50 text-gray-500 border-gray-100" };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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
      />

      {/* Validation Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-navy-900 text-white py-3 px-6 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 animate-in slide-in-from-bottom-5 duration-300">
          <Zap className="w-5 h-5 text-yellow-400 fill-current animate-pulse" />
          <p className="text-xs font-bold">{toastMessage}</p>
        </div>
      )}

      {/* Header section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestão de PDIs do Time</h1>
          <p className="text-gray-500 mt-2 text-sm font-medium">Acompanhe e valide o desenvolvimento contínuo dos seus liderados.</p>
        </div>
      </div>

      {/* Grid Filter Options */}
      <div className="bg-white border border-gray-100 shadow-sm p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all">
            <Filter className="w-3.5 h-3.5" />
            Filtros
          </button>
          <span className="text-xs font-bold text-gray-400">|</span>
          <button className="px-3 py-1.5 bg-primary-50 text-primary-600 border border-primary-100 rounded-lg text-xs font-bold">
            Todos os Times
          </button>
        </div>
        <p className="text-xs text-gray-400 font-bold">Mostrando {filteredTeam.length} colaboradores ativos</p>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-gray-400 font-bold">Carregando dados do time...</div>
        ) : filteredTeam.map((m) => {
          const status = getStatusBadge(m.pdiAverage);

          return (
            <div key={m.id} className="bg-white border border-gray-100 shadow-md rounded-2xl p-6 flex flex-col justify-between group hover:shadow-lg transition-all duration-300">

              {/* Card Header */}
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 bg-gray-100 shrink-0">
                      <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-base leading-snug">{m.name}</h3>
                      <p className="text-gray-400 text-xs font-medium mt-0.5">{m.role} · {m.level}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border ${status.class}`}>
                    {status.text}
                  </span>
                </div>

                {/* Subtitle */}
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-4 border-b border-gray-50 pb-2">
                  Última atualização: 12 dias atrás
                </p>

                {/* Goals/PDI Items progress list */}
                <div className="space-y-5 my-6">
                  {m.pdiHistory && m.pdiHistory.length > 0 ? (
                    m.pdiHistory.slice(0, 3).map((item, idx) => {
                      const goalStatus = getGoalStatusBadge(item.score);
                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-extrabold text-gray-800">{item.treinamento_nome}</span>
                              <span className="bg-primary-50 text-primary-600 text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-wider border border-primary-100/50">
                                {idx === 0 ? 'Liderança' : idx === 1 ? 'Tecnologia' : 'Eficácia'}
                              </span>
                            </div>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${goalStatus.class}`}>
                              {goalStatus.text}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-1000"
                                style={{ width: `${item.score}%`, backgroundColor: getDynamicProgressColor(item.score) }}
                              />
                            </div>
                            <span className="text-[10px] font-black text-gray-500 w-8 text-right">{item.score}%</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-gray-800">{m.pdiGoal || 'Treinamento de Liderança'}</span>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider bg-amber-50 text-amber-600 border-amber-100">
                          Em andamento
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${m.pdiAverage}%`, backgroundColor: getDynamicProgressColor(m.pdiAverage) }} />
                        </div>
                        <span className="text-[10px] font-black text-gray-500 w-8 text-right">{m.pdiAverage}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Actions Footer */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-50 mt-2">
                <button
                  onClick={() => setAnalysisMember(m)}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-purple-400 text-purple-600 font-bold py-2.5 rounded-xl hover:bg-purple-50 transition-all text-xs active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Analisar com IA
                </button>
                <button
                  onClick={() => handleValidateMilestone(m.name, m.pdiGoal || (m.pdiHistory?.[0]?.treinamento_nome || 'Objetivo PDI'))}
                  className="flex-1 bg-primary-600 text-white font-bold py-2.5 rounded-xl hover:bg-primary-700 transition-all text-xs text-center active:scale-95 shadow-sm"
                >
                  Validar Marco
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
        })}
      </div>

      {/* Pagination Footer */}
      <div className="bg-white border border-gray-100 shadow-sm p-6 rounded-2xl flex justify-between items-center mt-8">
        <p className="text-xs text-gray-400 font-bold">Página 1 de 3</p>
        <div className="flex gap-2">
          <button className="p-2.5 border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50 transition-all active:scale-95">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex gap-1">
            <button className="w-9 h-9 bg-primary-50 text-primary-600 border border-primary-100 rounded-xl text-xs font-black flex items-center justify-center">1</button>
            <button className="w-9 h-9 text-gray-500 hover:bg-gray-50 rounded-xl text-xs font-bold flex items-center justify-center">2</button>
            <button className="w-9 h-9 text-gray-500 hover:bg-gray-50 rounded-xl text-xs font-bold flex items-center justify-center">3</button>
          </div>
          <button className="p-2.5 border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50 transition-all active:scale-95">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;
