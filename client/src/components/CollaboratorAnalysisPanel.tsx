import React, { useState, useEffect } from 'react';
import {
  X, Sparkles, TrendingUp, TrendingDown, Target, Lightbulb,
  AlertTriangle, CheckCircle2, Calendar, User, Zap, ChevronRight, Briefcase
} from 'lucide-react';
import { type PDITraining } from './TrainingHistoryModal';
import axios from 'axios';
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

interface Analysis {
  momentoAtual: string;
  pontosAtencao: string[];
  destaques: string[];
  recomendacoes: string[];
  proximoPasso: string;
  projecao: string;
}

interface Props {
  member: TeamMember | null;
  onClose: () => void;
}

const generateAnalysis = (m: TeamMember): Analysis => {
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
    momentoAtual: `${m.name} está ${statusLabel}. Com foco em "${topTraining?.treinamento_nome || m.pdiGoal}", o progresso consolidado de ${m.pdiAverage}% indica ${m.pdiAverage >= 70 ? 'uma trajetória sólida e consistente com o plano estabelecido' : 'a necessidade de revisão e reforço no plano de desenvolvimento'}. Nível ${m.level} — ${m.pdiAverage >= 80 ? 'elegível para desafios de maior complexidade no próximo ciclo' : 'deve consolidar as competências atuais antes de avançar de nível'}.`,

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
        ? `Agendar 1:1 estruturado para mapear obstáculos em "${lateItems[0]?.treinamento_nome || m.pdiGoal}" com pauta e registro formal.`
        : `Validar formalmente o marco de "${topTraining?.treinamento_nome || m.pdiGoal}" no sistema e documentar as evidências observadas.`,
      lateItems.length > 0
        ? `Propor plano de recuperação de 30 dias para "${lateItems[0].treinamento_nome}" com metas semanais mensuráveis.`
        : `Considerar uma trilha de nível superior para manter o engajamento e acelerar o crescimento.`,
      goodItems.length > 0
        ? `Reconhecer formalmente o avanço em "${goodItems[0].treinamento_nome}" no próximo ciclo de feedback da equipe.`
        : `Definir junto com ${firstName} metas mais granulares e mensuráveis para os próximos 45 dias.`,
    ],

    proximoPasso:
      m.pdiAverage < 50
        ? `Agendar 1:1 focado nos bloqueadores de "${lateItems[0]?.treinamento_nome || m.pdiGoal}" nos próximos 7 dias. Revisar se o objetivo do PDI ainda é aderente ao contexto atual da área.`
        : m.pdiAverage < 70
        ? `Validar o marco de "${topTraining?.treinamento_nome || m.pdiGoal}" e entregar feedback escrito sobre a aplicação prática. Propor um desafio complementar de 2 semanas.`
        : `Reconhecer o desempenho de ${firstName} e propor elevação de complexidade nos objetivos do próximo ciclo do PDI.`,

    projecao:
      m.pdiAverage >= 80
        ? `Com o ritmo atual, ${firstName} tem perfil para atingir excelência no PDI vigente até o fim do trimestre. Elegível para expansão de responsabilidades e mentoria de pares.`
        : m.pdiAverage >= 60
        ? `Mantendo a cadência, ${firstName} deve concluir os objetivos principais dentro do prazo. Uma revisão de meio de ciclo é recomendada para recalibrar as metas.`
        : `O ritmo atual exige intervenção estruturada. Sem ajuste no plano, há risco concreto de não cumprimento dos objetivos do PDI no ciclo vigente.`,
  };
};

const getScoreColor = (score: number) => {
  if (score >= 85) return { bar: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' };
  if (score >= 70) return { bar: 'bg-indigo-500', text: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-700' };
  if (score >= 50) return { bar: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' };
  return { bar: 'bg-rose-500', text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-700' };
};

const getGoalStatusLabel = (score: number) => {
  if (score >= 90) return { text: 'Concluído', class: 'bg-emerald-100 text-emerald-700' };
  if (score >= 70) return { text: 'No Ritmo', class: 'bg-indigo-100 text-indigo-700' };
  if (score >= 40) return { text: 'Em Andamento', class: 'bg-amber-100 text-amber-700' };
  return { text: 'Em Risco', class: 'bg-rose-100 text-rose-700' };
};

const SkeletonLine: React.FC<{ width?: string; height?: string }> = ({ width = 'w-full', height = 'h-3' }) => (
  <div className={`${width} ${height} bg-gray-200 rounded-full animate-pulse`} />
);

const LoadingSkeleton: React.FC<{ name: string }> = ({ name }) => (
  <div className="flex-1 overflow-y-auto p-8 space-y-8">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm font-bold text-purple-500 animate-pulse">Gerando análise de {name}...</span>
    </div>
    <div className="space-y-4 p-5 bg-white rounded-2xl border border-gray-100">
      <SkeletonLine width="w-1/3" height="h-2.5" />
      <SkeletonLine />
      <SkeletonLine width="w-4/5" />
      <SkeletonLine width="w-3/5" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="p-5 bg-white rounded-2xl border border-gray-100 space-y-3">
          <SkeletonLine width="w-1/2" height="h-2.5" />
          <SkeletonLine />
          <SkeletonLine width="w-3/4" />
        </div>
      ))}
    </div>
    <div className="p-5 bg-white rounded-2xl border border-gray-100 space-y-3">
      <SkeletonLine width="w-1/4" height="h-2.5" />
      <SkeletonLine />
      <SkeletonLine width="w-5/6" />
      <SkeletonLine width="w-2/3" />
    </div>
  </div>
);

const CollaboratorAnalysisPanel: React.FC<Props> = ({ member, onClose }) => {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [roleRequirements, setRoleRequirements] = useState<any[]>([]);
  const isOpen = member !== null;

  useEffect(() => {
    if (!member) {
      setAnalysis(null);
      setRoleRequirements([]);
      return;
    }
    setAnalysis(null);
    setIsLoading(true);

    axios.get('http://localhost:3001/api/roles')
      .then(res => {
        const roles = res.data;
        const matched = roles.find((r: any) => 
          member.role.toLowerCase().includes(r.name.toLowerCase()) || 
          r.name.toLowerCase().includes(member.role.toLowerCase())
        );
        if (matched) {
          setRoleRequirements(matched.competencies);
        } else {
          setRoleRequirements([]);
        }
      })
      .catch(err => console.error("Error loading role requirements in drawer", err));

    const timer = setTimeout(() => {
      setAnalysis(generateAnalysis(member));
      setIsLoading(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, [member?.id]);

  if (!isOpen) return null;

  const colors = getScoreColor(member.pdiAverage);
  const statusLabel =
    member.pdiAverage >= 85 ? 'Acima da Média' :
    member.pdiAverage >= 70 ? 'On Track' :
    member.pdiAverage >= 50 ? 'Em Progresso' : 'Em Atraso';

  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-4xl flex flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">

        {/* Dark Header */}
        <div className="shrink-0 bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950 px-8 pt-8 pb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/10 blur-3xl rounded-full pointer-events-none" />

          {/* Top row */}
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest">Análise PDI com IA</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Collaborator info */}
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/20 shrink-0">
              <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black text-white leading-tight">{member.name}</h2>
              <p className="text-gray-400 text-sm mt-0.5">{member.role}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-black bg-white/10 text-gray-300 px-2.5 py-1 rounded-full border border-white/10">
                  {member.level}
                </span>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${colors.badge}`}>
                  {statusLabel}
                </span>
              </div>
            </div>

            {/* Score badge */}
            <div className="shrink-0 text-center bg-white/10 border border-white/10 rounded-2xl px-5 py-3">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Progresso PDI</p>
              <p className={`text-3xl font-black ${colors.text}`}>{member.pdiAverage}%</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5 relative z-10">
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${member.pdiAverage}%`, backgroundColor: getDynamicProgressColor(member.pdiAverage) }}
              />
            </div>
          </div>

          {/* Meta */}
          <p className="mt-3 text-[10px] text-gray-500 relative z-10">
            Gerado em {today} · PDI Hub Intelligence
          </p>
        </div>

        {/* Body */}
        {isLoading ? (
          <LoadingSkeleton name={member.name.split(' ')[0]} />
        ) : analysis ? (
          <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
              
              {/* Left Column (span 2): Cargo e Requisitos */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Requirements Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
                    <Briefcase className="w-4 h-4 text-primary-600" />
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Requisitos do Cargo</h3>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Cargo Cadastrado</p>
                    <p className="text-sm font-extrabold text-gray-800 mt-0.5">{member.role}</p>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Competências Exigidas</p>
                    {roleRequirements.length > 0 ? (
                      <ul className="space-y-2">
                        {roleRequirements.map((req, i) => (
                          <li key={i} className="text-xs font-bold text-gray-600 flex flex-col gap-1 bg-gray-50/50 p-2.5 rounded-lg border border-gray-100/50">
                            <span className="text-gray-800">{req.competencia}</span>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-[8px] font-black uppercase text-gray-400">{req.tipo}</span>
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                                req.nivel_necessario.toLowerCase().includes('avançado') || req.nivel_necessario.toLowerCase().includes('avancado')
                                  ? 'bg-purple-50 text-purple-600 border-purple-100'
                                  : req.nivel_necessario.toLowerCase().includes('intermediário') || req.nivel_necessario.toLowerCase().includes('intermediario')
                                  ? 'bg-blue-50 text-blue-600 border-blue-100'
                                  : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              }`}>
                                {req.nivel_necessario}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Nenhum requisito mapeado para este cargo.</p>
                    )}
                  </div>
                </div>

                {/* Section: PDI Progress */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-4 h-4 text-gray-400" />
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Progresso por Objetivo</h3>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                    {(member.pdiHistory?.length > 0 ? member.pdiHistory : [{ treinamento_nome: member.pdiGoal || 'Objetivo Principal', score: member.pdiAverage, conhecimento: '', aplicacao: '', desempenho: '', eficacia: '' }])
                      .slice(0, 4)
                      .map((item, idx) => {
                        const gs = getGoalStatusLabel(item.score);
                        const sc = getScoreColor(item.score);
                        return (
                          <div key={idx} className="px-4 py-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-bold text-xs text-gray-800 truncate">{item.treinamento_nome}</span>
                              </div>
                              <div className="flex items-center gap-2 ml-2 shrink-0">
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${gs.class}`}>{gs.text}</span>
                                <span className={`text-xs font-black ${sc.text}`}>{item.score}%</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${item.score}%`, backgroundColor: getDynamicProgressColor(item.score) }} />
                              </div>
                              {item.eficacia && (
                                <span className={`text-[8px] font-bold ${item.eficacia === 'Sim' ? 'text-emerald-500' : 'text-gray-300'}`}>
                                  {item.eficacia === 'Sim' ? '✓' : '✗'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Right Column (span 3): AI Analysis */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* Section: AI Analysis Grid */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Análise Gerada por IA</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">

                    {/* Momento Atual */}
                    <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-indigo-500" />
                        </div>
                        <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider">Momento Atual</h4>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{analysis.momentoAtual}</p>
                    </div>

                    {/* Pontos de Atenção */}
                    <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 bg-rose-50 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                        </div>
                        <h4 className="text-xs font-black text-rose-700 uppercase tracking-wider">Pontos de Atenção</h4>
                      </div>
                      <ul className="space-y-2.5">
                        {analysis.pontosAtencao.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                            <span className="w-1 h-1 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Destaques */}
                    <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <h4 className="text-xs font-black text-emerald-700 uppercase tracking-wider">Destaques Positivos</h4>
                      </div>
                      <ul className="space-y-2.5">
                        {analysis.destaques.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                            <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Section: Recomendações */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Recomendações para o Gestor</h3>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                    {analysis.recomendacoes.map((rec, i) => (
                      <div key={i} className="flex items-start gap-4 px-5 py-4">
                        <div className="w-6 h-6 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[10px] font-black text-amber-600">{i + 1}</span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section: Próximo Passo + Projeção */}
                <div className="grid grid-cols-1 gap-4">

                  {/* Próximo Passo */}
                  <div className="bg-gradient-to-br from-gray-900 to-indigo-950 rounded-2xl p-6 relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />
                    <div className="flex items-center gap-2 mb-3 relative z-10">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">Próximo Passo Recomendado</h4>
                    </div>
                    <p className="text-sm text-gray-200 leading-relaxed relative z-10">{analysis.proximoPasso}</p>
                  </div>

                  {/* Projeção */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider">Projeção do Ciclo</h4>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{analysis.projecao}</p>
                  </div>
                </div>

                {/* Skills */}
                {member.skills?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-4 h-4 text-gray-400" />
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Competências Técnicas Mapeadas</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {member.skills.map((skill, i) => (
                        <span key={i} className="text-xs font-bold bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl shadow-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
            <div className="pb-4" />
          </div>
        ) : null}
      </div>
    </>
  );
};

export default CollaboratorAnalysisPanel;
