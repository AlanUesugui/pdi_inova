import React, { useState, useEffect } from 'react';
import {
  X, Sparkles, TrendingUp, Target, Lightbulb,
  AlertTriangle, CheckCircle2, User, Zap, HelpCircle,
  Info, Layers, Plus, Edit3, Save, Database, ArrowRight,
  BarChart2
} from 'lucide-react';
import { type PDITraining } from './TrainingHistoryModal';
import api from '../utils/api';
import { getDynamicProgressColor } from '../utils/colors';
import ExplainabilityModal, { type ExplainabilityData } from './ExplainabilityModal';

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
  potencial_crescimento?: string;
  nota_desempenho?: string;
  comentarios_gestor?: string;
  nivel_prontidao?: string;
  mapa_sucessao?: string;
}

interface SelfVsManagerItem {
  competencia: string;
  autoavaliacao: number;
  gestor: number;
  diferenca: number;
  interpretacao: string;
  temDivergencia: boolean;
}

interface PriorityGap {
  id: string;
  competencia: string;
  prioridade: 'Alta' | 'Média' | 'Baixa';
  prioridadeCor: string;
  confianca: 'Alta' | 'Moderada' | 'Limitada' | 'Dados Insuficientes';
  confiancaClass: string;
  dadoObservado: string;
  interpretacao: string;
  porQuePrioridade: string;
  impacto: string;
  causaProvavel: string;
  evidencias: string[];
}

interface Recommendation702010 {
  tipo: '70% Prática' | '20% Social' | '10% Formação';
  tipoBadge: string;
  competencia: string;
  objetivo: string;
  acao: string;
  frequencia: string;
  evidenciaSucesso: string;
  prazo: string;
  porQueRecomendou: string;
}

interface EditablePDIAction {
  id: string;
  prioridade: 'Alta' | 'Média' | 'Baixa';
  objetivo: string;
  acao: string;
  prazo: string;
  evidencia: string;
  progresso: number;
  adicionado: boolean;
}

interface CompetenciaBarData {
  competencia: string;
  atual: number;
  esperado: number;
  gap: number;
  prioridade: 'Alta' | 'Média' | 'Baixa';
}

interface Matriz2x2Data {
  competencia: string;
  necessidadeGap: number; // 1 to 5 scale (where 5 is largest gap)
  relevanciaCargo: number; // 1 to 5 scale
  classificacao: 'Prioridade Alta' | 'Manutenção' | 'Desenvolvimento Secundário' | 'Baixa Prioridade';
  badgeCor: string;
}

interface PDIProgressDistribution {
  concluido: number;
  emAndamento: number;
  atrasado: number;
  naoIniciado: number;
  interpretacaoIA: string;
}

interface PDIAnalysis {
  sintese: string;
  leituraDesenvolvimento: string[];
  selfVsManager: SelfVsManagerItem[];
  historicoEvolucao: { ano: string; nota: number }[];
  historicoInterpretacao: string;
  prioridades: PriorityGap[];
  outrasOportunidades: PriorityGap[];
  recomendacoes702010: Recommendation702010[];
  contextoCarreira: {
    temTrajetoriaClara: boolean;
    texto: string;
  };
  evidenciasUtilizadas: { fonte: string; utilizada: boolean; detalhe: string }[];
  limitacoes: string[];
  planoAcaoSugerido: EditablePDIAction[];
  competenciasBarChart: CompetenciaBarData[];
  barChartInterpretacao: { oQueMostra: string; porQueImporta: string };
  matrizImpactoNecessidade: Matriz2x2Data[];
  progressoPDIDistribuicao: PDIProgressDistribution;
}

interface Props {
  member: TeamMember | null;
  onClose: () => void;
  onNavigateToCareer?: () => void;
  initialOpenValidation?: boolean;
}

const generateFullPDIAnalysis = (m: TeamMember, roleReqs: any[]): PDIAnalysis => {
  const firstName = m.name.split(' ')[0];
  const perfNum = parseFloat(m.nota_desempenho || '0');
  const isHighPerformance = !isNaN(perfNum) && perfNum >= 4.0;
  const isHighPotential = /alto/i.test(m.potencial_crescimento || '');

  // 1. Executive Summary (Síntese do PDI)
  const sintese = `A análise indica que as principais oportunidades de desenvolvimento de ${firstName} estão centradas em comunicação profissional, gestão de entregas e liderança técnica. A avaliação do gestor e as respostas do colaborador apresentam convergência em relação à necessidade de evolução em autonomia. Recomenda-se priorizar experiências práticas de aplicação no dia a dia (modelo 70-20-10), acompanhadas por ciclos quinzenais de feedback escrito.`;

  // 2. Leitura do Desenvolvimento
  const leituraDesenvolvimento = [
    `O principal foco de desenvolvimento identificado para ${firstName} está relacionado à clareza na comunicação, condução autônoma de entregas e maior capacidade de alinhamento com áreas correlatas.`,
    `As evidências disponíveis apontam que o colaborador possui boa formação conceitual e engajamento adequado com os objetivos da equipe (${m.pdiAverage}% de progresso acumulado). No entanto, surgem oportunidades claras em momentos que exigem sintetizar cenários de decisão e liderar discussões técnicas sob pressão.`,
    `Esse desenvolvimento possui relevância elevada para o cargo de ${m.role}, uma vez que a transição para posições de maior senioridade exige transformar conhecimento técnico em capacidade de influência e orientação de pares.`,
    `O PDI deve priorizar experiências práticas de campo e desafios reais de apresentação no ambiente de trabalho (70% do aprendizado), em vez de focar excessivamente em cursos e formações passivas de catálogo.`
  ];

  // 3. Competências Atual × Esperado (Chart Data)
  const competenciasBarChart: CompetenciaBarData[] = [
    { competencia: 'Comunicação Profissional', atual: 2.0, esperado: 4.0, gap: -2.0, prioridade: 'Alta' },
    { competencia: 'Gestão de Projetos & Prazos', atual: 2.5, esperado: 4.0, gap: -1.5, prioridade: 'Alta' },
    { competencia: 'Liderança Técnica & Influência', atual: 3.0, esperado: 4.0, gap: -1.0, prioridade: 'Média' },
    { competencia: 'Visão de Negócio & KPIs', atual: 3.0, esperado: 3.5, gap: -0.5, prioridade: 'Baixa' },
    { competencia: 'Resolução de Problemas', atual: 4.0, esperado: 4.0, gap: 0.0, prioridade: 'Baixa' }
  ];

  const barChartInterpretacao = {
    oQueMostra: 'As maiores diferenças entre o nível observado e o nível esperado para o cargo aparecem em Comunicação Profissional (diferença de -2.0) e Gestão de Projetos (-1.5).',
    porQueImporta: `Essas competências possuem alta relevância para o desempenho no cargo atual de ${m.role} e foram selecionadas como focos prioritários no plano de desenvolvimento.`
  };

  // 4. Matriz 2x2 Impacto × Necessidade de Desenvolvimento
  const matrizImpactoNecessidade: Matriz2x2Data[] = [
    { competencia: 'Comunicação Profissional', necessidadeGap: 4.5, relevanciaCargo: 4.8, classificacao: 'Prioridade Alta', badgeCor: 'bg-rose-100 text-rose-700 border-rose-200' },
    { competencia: 'Gestão de Projetos', necessidadeGap: 4.0, relevanciaCargo: 4.2, classificacao: 'Prioridade Alta', badgeCor: 'bg-rose-100 text-rose-700 border-rose-200' },
    { competencia: 'Liderança Técnica', necessidadeGap: 3.2, relevanciaCargo: 4.5, classificacao: 'Prioridade Alta', badgeCor: 'bg-amber-100 text-amber-700 border-amber-200' },
    { competencia: 'Resolução de Problemas', necessidadeGap: 1.5, relevanciaCargo: 4.5, classificacao: 'Manutenção', badgeCor: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { competencia: 'Visão de Negócio', necessidadeGap: 2.5, relevanciaCargo: 2.2, classificacao: 'Desenvolvimento Secundário', badgeCor: 'bg-blue-100 text-blue-700 border-blue-200' }
  ];

  // 5. Autoavaliação vs Avaliação do Gestor
  const selfVsManager: SelfVsManagerItem[] = [
    {
      competencia: 'Comunicação & Alinhamento',
      autoavaliacao: 3.5,
      gestor: 3.0,
      diferenca: 0.5,
      interpretacao: 'Percepções muito próximas. Ambas as partes reconhecem oportunidade de evolução na síntese de informações.',
      temDivergencia: false
    },
    {
      competencia: 'Liderança Técnica & Influência',
      autoavaliacao: 4.2,
      gestor: 2.8,
      diferenca: 1.4,
      interpretacao: 'Diferença significativa. O colaborador percebe maior domínio técnico e influência do que o gestor observa nas entregas do dia a dia.',
      temDivergencia: true
    },
    {
      competencia: 'Gestão de Entregas & Autonomia',
      autoavaliacao: 3.8,
      gestor: 3.8,
      diferenca: 0.0,
      interpretacao: 'Alinhamento total de visão entre colaborador e gestor sobre a capacidade de execução.',
      temDivergencia: false
    },
    {
      competencia: 'Resolução de Problemas Complexos',
      autoavaliacao: 3.0,
      gestor: 4.0,
      diferenca: -1.0,
      interpretacao: 'O gestor avalia a capacidade analítica acima do que o próprio colaborador estima em sua autoavaliação.',
      temDivergencia: false
    }
  ];

  // 6. Histórico de Evolução
  const historicoEvolucao = [
    { ano: '2024', nota: 3.0 },
    { ano: '2025', nota: 3.5 },
    { ano: '2026', nota: Number((m.pdiAverage / 20).toFixed(1)) || 4.0 }
  ];

  const historicoInterpretacao = `A evolução de competências demonstra crescimento constante entre 2024 e 2025, com consolidação da nota no ciclo de 2026. Isso indica consolidação das bases técnicas atuais e prontidão para assumir desafios práticos de maior complexidade.`;

  // 7. Prioridades de Desenvolvimento (1-3 principais)
  const prioridades: PriorityGap[] = [
    {
      id: 'p1',
      competencia: 'Comunicação Profissional & Influência',
      prioridade: 'Alta',
      prioridadeCor: 'bg-rose-100 text-rose-700 border-rose-200',
      confianca: 'Alta',
      confiancaClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dadoObservado: 'A autoavaliação (3.5) e a nota do gestor (3.0) indicam convergência na oportunidade de melhoria.',
      interpretacao: 'Existe uma diferença entre o nível observado e o nível esperado para o horizonte de aceleração no cargo.',
      porQuePrioridade: 'A competência foi priorizada porque possui alta relevância para as responsabilidades do cargo atual e aparece como pré-requisito fundamental para liderança de iniciativas.',
      impacto: 'Aumentará a clareza na condução de alinhamentos e reduzirá retrabalhos entre áreas correlatas.',
      causaProvavel: 'Os dados sugerem que o desafio está relacionado à falta de prática constante em apresentações executivas do que à ausência de conhecimento teórico.',
      evidencias: [
        'Avaliação formal do gestor no último ciclo',
        'Autoavaliação registrada no módulo de PDI',
        'Comentários qualitativos apontando oportunidade de síntese em reuniões'
      ]
    },
    {
      id: 'p2',
      competencia: 'Liderança Técnica & Orientação de Pares',
      prioridade: 'Média',
      prioridadeCor: 'bg-amber-100 text-amber-700 border-amber-200',
      confianca: 'Moderada',
      confiancaClass: 'bg-amber-50 text-amber-700 border-amber-200',
      dadoObservado: 'Divergência relevante registrada entre autoavaliação (4.2) e avaliação do gestor (2.8).',
      interpretacao: 'O colaborador percebe maior alcance de influência técnica do que a liderança tem observado na prática.',
      porQuePrioridade: 'Identificada como prioridade de alinhamento para equilibrar a expectativa do colaborador com os critérios de senioridade da empresa.',
      impacto: 'Permitirá que a influência técnica de ' + firstName + ' seja formalmente reconhecida e aproveitada no time.',
      causaProvavel: 'Necessidade de estruturar papéis claros de liderança técnica em projetos de maior visibilidade.',
      evidencias: [
        'Matriz comparativa Autoavaliação vs Gestor',
        'Requisitos de cargo para senioridade superior'
      ]
    },
    {
      id: 'p3',
      competencia: 'Gestão de Projetos & Prazos',
      prioridade: 'Média',
      prioridadeCor: 'bg-amber-100 text-amber-700 border-amber-200',
      confianca: 'Moderada',
      confiancaClass: 'bg-amber-50 text-amber-700 border-amber-200',
      dadoObservado: `Conclusão consolidada de PDI em ${m.pdiAverage}% nos treinamentos da área.`,
      interpretacao: 'Ritmo adequado de evolução, exigindo consolidação prática de cronogramas e escopo.',
      porQuePrioridade: 'Garante que os projetos sob liderança do colaborador atinjam os marcos sem desvios de planejamento.',
      impacto: 'Ganho direto em previsibilidade de entregas e eficiência de alocação de tempo.',
      causaProvavel: 'Necessidade de maior familiaridade com ferramentas estruturadas de gestão visual.',
      evidencias: [
        `Histórico de ${m.pdiHistory?.length || 1} treinamentos concluídos no PDI`,
        'Respostas registradas do colaborador'
      ]
    }
  ];

  const outrasOportunidades: PriorityGap[] = [
    {
      id: 'p4',
      competencia: 'Visão de Negócio & Métricas de Impacto',
      prioridade: 'Baixa',
      prioridadeCor: 'bg-blue-100 text-blue-700 border-blue-200',
      confianca: 'Limitada',
      confiancaClass: 'bg-orange-50 text-orange-700 border-orange-200',
      dadoObservado: 'Nível adequado às exigências básicas do cargo atual.',
      interpretacao: 'Desenvolvimento complementar para ciclos futuros de carreira.',
      porQuePrioridade: 'Não representa gargalo no curto prazo, mas amplia a bagagem executiva.',
      impacto: 'Melhor compreensão de KPIs de negócio.',
      causaProvavel: 'Oportunidade natural de exposição ao comitê executivo.',
      evidencias: ['Fatos observados no histórico acadêmico/profissional']
    }
  ];

  // 8. Modelo 70-20-10
  const recomendacoes702010: Recommendation702010[] = [
    {
      tipo: '70% Prática',
      tipoBadge: 'bg-purple-100 text-purple-700 border-purple-200',
      competencia: 'Comunicação Profissional',
      objetivo: 'Conduzir alinhamentos e reuniões com autonomia e síntese.',
      acao: 'Conduzir mensalmente a apresentação de status da área para o time estendido durante os próximos 3 meses.',
      frequencia: 'Mensal',
      evidenciaSucesso: 'Avaliação estruturada do gestor após cada apresentação realizada.',
      prazo: '90 dias',
      porQueRecomendou: 'A prática real em ambiente controlado desenvolve maior segurança e poder de síntese do que treinamentos exclusivamente teóricos.'
    },
    {
      tipo: '20% Social',
      tipoBadge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      competencia: 'Liderança Técnica',
      objetivo: 'Alinhar percepção de senioridade e trocar feedbacks práticos.',
      acao: 'Realizar sessões quinzenais de mentoria/1:1 com um Especialista da área para revisão de arquitetura e código.',
      frequencia: 'Quinzenal',
      evidenciaSucesso: 'Anotações compartilhadas em 1:1 e registro de aprendizados no PDI.',
      prazo: '60 dias',
      porQueRecomendou: 'Mentoria com pares de alta senioridade acelera o alinhamento de expectativas e o entendimento de padrões corporativos.'
    },
    {
      tipo: '10% Formação',
      tipoBadge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      competencia: 'Gestão de Projetos',
      objetivo: 'Consolidar metodologias ágeis e gestão visual.',
      acao: 'Concluir módulo de formação executiva sobre Gestão Visual e Frameworks Ágeis na plataforma interna.',
      frequencia: 'Uma vez (Autoestudo)',
      evidenciaSucesso: 'Certificado anexado e aplicação prática das ferramentas no quadro do time.',
      prazo: '30 dias',
      porQueRecomendou: 'Reforça o embasamento teórico para suportar as práticas de gestão no dia a dia.'
    }
  ];

  // 9. Progresso do PDI
  const concl = Math.min(100, Math.round(m.pdiAverage));
  const emAnd = Math.max(0, 100 - concl);
  const progressoPDIDistribuicao: PDIProgressDistribution = {
    concluido: concl,
    emAndamento: emAnd,
    atrasado: 0,
    naoIniciado: 0,
    interpretacaoIA: `O PDI apresenta ${concl}% das ações concluídas. Apesar do progresso geral acumulado, a principal ação prática relacionada à competência prioritária (Comunicação Profissional) ainda está em andamento. Lembre-se: Conclusão de ações ≠ desenvolvimento garantido de competência.`
  };

  // 10. Contexto de Carreira
  const contextoCarreira = {
    temTrajetoriaClara: isHighPotential || isHighPerformance,
    texto: (isHighPotential || isHighPerformance)
      ? `O desenvolvimento destas competências também contribui para preparar ${firstName} para posições de maior responsabilidade mapeadas na análise de inteligência de carreira.`
      : `O desenvolvimento recomendado está relacionado principalmente ao desempenho e às responsabilidades atuais do cargo de ${m.role}.`
  };

  // 11. Evidências e Fontes
  const evidenciasUtilizadas = [
    { fonte: 'Avaliação do Gestor', utilizada: true, detalhe: m.comentarios_gestor ? 'Registros qualitativos presentes' : 'Notas quantitativas utilizadas' },
    { fonte: 'Autoavaliação do Colaborador', utilizada: true, detalhe: 'Notas registradas na plataforma' },
    { fonte: 'Expectativas do Cargo', utilizada: roleReqs.length > 0, detalhe: `${roleReqs.length} competências mapeadas na matriz` },
    { fonte: 'Respostas e Histórico do PDI', utilizada: (m.pdiHistory?.length || 0) > 0, detalhe: `${m.pdiHistory?.length || 1} treinamentos computados` },
    { fonte: 'Histórico de Ciclos Anteriores', utilizada: true, detalhe: 'Dados consolidados de 2024 a 2026' }
  ];

  // 12. Limitações
  const limitacoes = [
    ...(!m.comentarios_gestor ? ['Ausência de comentários qualitativos extensos do gestor no último ciclo.'] : []),
    ...(roleReqs.length === 0 ? ['Matriz corporativa de cargos com detalhamento em sincronização.'] : []),
    'Análise baseada nos registros estruturados disponíveis na plataforma até a presente data.'
  ];

  // 13. Plano de Ação Sugerido (PDI Editável)
  const planoAcaoSugerido: EditablePDIAction[] = [
    {
      id: 'act1',
      prioridade: 'Alta',
      objetivo: 'Elevar clareza e síntese na comunicação profissional',
      acao: 'Conduzir apresentações mensais de status do time para a liderança',
      prazo: '3 meses',
      evidencia: 'Feedback estruturado do gestor ao término de cada reunião',
      progresso: 75,
      adicionado: true
    },
    {
      id: 'act2',
      prioridade: 'Média',
      objetivo: 'Fortalecer autonomia em Gestão de Projetos',
      acao: 'Estruturar o quadro visual de tarefas da sprint e monitorar bloqueios',
      prazo: '2 meses',
      evidencia: 'Aumento na previsibilidade de entregas sem desvios de prazo',
      progresso: 50,
      adicionado: true
    },
    {
      id: 'act3',
      prioridade: 'Média',
      objetivo: 'Desenvolver influência e liderança técnica',
      acao: 'Liderar 2 sessões de refatoração / Dojo técnico com a equipe',
      prazo: '3 meses',
      evidencia: 'Documentação técnica gerada e compartilhada no repositório',
      progresso: 30,
      adicionado: false
    }
  ];

  return {
    sintese,
    leituraDesenvolvimento,
    selfVsManager,
    historicoEvolucao,
    historicoInterpretacao,
    prioridades,
    outrasOportunidades,
    recomendacoes702010,
    contextoCarreira,
    evidenciasUtilizadas,
    limitacoes,
    planoAcaoSugerido,
    competenciasBarChart,
    barChartInterpretacao,
    matrizImpactoNecessidade,
    progressoPDIDistribuicao
  };
};

const getScoreColor = (score: number) => {
  if (score >= 85) return { bar: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' };
  if (score >= 70) return { bar: 'bg-indigo-500', text: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-700' };
  if (score >= 50) return { bar: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' };
  return { bar: 'bg-rose-500', text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-700' };
};

const CollaboratorAnalysisPanel: React.FC<Props> = ({ member, onClose, onNavigateToCareer, initialOpenValidation }) => {
  const [analysisData, setAnalysisData] = useState<PDIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Traceability Modal state ("Como chegamos a essa conclusão?")
  const [explainModalOpen, setExplainModalOpen] = useState(false);
  const [explainData, setExplainData] = useState<ExplainabilityData | null>(null);

  // Milestone Validation Modal state ("Validar Marco do PDI")
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(Boolean(initialOpenValidation));
  const [selectedMilestone, setSelectedMilestone] = useState('');
  const [validationStatus, setValidationStatus] = useState('Eficácia Comprovada');
  const [validationNotes, setValidationNotes] = useState('');

  // Hover state for interactive chart tooltips
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [hoveredMatrixIndex, setHoveredMatrixIndex] = useState<number | null>(null);

  // Action plan edit state
  const [editablePlan, setEditablePlan] = useState<EditablePDIAction[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Partial<EditablePDIAction>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const isOpen = member !== null;

  useEffect(() => {
    if (member && initialOpenValidation) {
      setIsValidationModalOpen(true);
    }
  }, [member?.id, initialOpenValidation]);

  useEffect(() => {
    if (!member) {
      setAnalysisData(null);
      setEditablePlan([]);
      return;
    }
    setAnalysisData(null);
    setIsLoading(true);

    api.get('/api/roles')
      .then(res => {
        const roles = res.data;
        const matched = roles.find((r: any) =>
          member.role.toLowerCase().includes(r.name.toLowerCase()) ||
          r.name.toLowerCase().includes(member.role.toLowerCase())
        );
        const reqs = matched ? matched.competencies : [];

        const data = generateFullPDIAnalysis(member, reqs);
        setAnalysisData(data);
        setEditablePlan(data.planoAcaoSugerido);
      })
      .catch(err => {
        console.error("Error loading role requirements", err);
        const data = generateFullPDIAnalysis(member, []);
        setAnalysisData(data);
        setEditablePlan(data.planoAcaoSugerido);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [member?.id]);

  if (!isOpen || !member) return null;

  const colors = getScoreColor(member.pdiAverage);
  const statusLabel =
    member.pdiAverage >= 85 ? 'Acima da Média' :
    member.pdiAverage >= 70 ? 'On Track' :
    member.pdiAverage >= 50 ? 'Em Progresso' : 'Em Atraso';

  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const openReasoningModal = (priority: PriorityGap) => {
    setExplainData({
      title: `Rastreabilidade: ${priority.competencia}`,
      indicatorName: `Justificativa da Prioridade ${priority.prioridade}`,
      formulaDescription: priority.porQuePrioridade,
      breakdownItems: priority.evidencias,
      period: 'Ciclo Vigente de 2026',
      rules: [
        'Análise baseada em convergência de autoavaliação, nota do gestor e requisitos do cargo.',
        `Magnitude do gap considerado para classificar como ${priority.prioridade}.`,
        'Grau de autonomia necessário para evolução de nível.'
      ],
      lastUpdate: today,
      dataSource: 'Análise Integrada (Gestor + Autoavaliação + Cargo)',
      aiDetails: {
        prompt: `Qual a justificativa da priorização da competência ${priority.competencia}?`,
        dataUsed: ['Matriz de Competências', 'Autoavaliação', 'Comentários do Gestor', 'Respostas do PDI'],
        limitations: priority.causaProvavel,
        confidence: priority.confianca
      }
    });
    setExplainModalOpen(true);
  };

  const openMethodologyModal = () => {
    setExplainData({
      title: 'Como a Análise de PDI Funciona?',
      indicatorName: 'Metodologia e Princípios de Inteligência de PDI',
      formulaDescription: 'A análise combina as informações disponíveis sobre o colaborador, como competências avaliadas, expectativas do cargo, avaliações realizadas, respostas do PDI e demais informações estruturadas disponíveis na plataforma.',
      breakdownItems: [
        'Cruzamento de Autoavaliação vs Avaliação do Gestor',
        'Alinhamento com Matriz Corporativa do Cargo',
        'Classificação de Prioridades (Alta, Média, Baixa)',
        'Organização de Recomendações no Modelo 70-20-10',
        'Rastreabilidade total das conclusões'
      ],
      period: 'Metodologia PDI Hub 2026',
      rules: [
        'As recomendações são construídas a partir dessas evidências e priorizadas considerando sua relevância.',
        'Quando existirem lacunas ou informações incompletas, elas serão apresentadas como limitações da análise.',
        'A análise deve ser utilizada como apoio à construção e acompanhamento do PDI, e não como uma decisão automática.'
      ],
      lastUpdate: today,
      dataSource: 'Motor de Inteligência de PDI & Desenvolvimento',
      aiDetails: {
        dataUsed: ['Avaliação de Desempenho', 'Matriz 9-Box', 'Planos de Sucessão', 'Formulários 1:1'],
        limitations: 'Análise analítica de apoio sem decisões autônomas de movimentação.',
        confidence: '95%'
      }
    });
    setExplainModalOpen(true);
  };

  const handleToggleAddAction = (id: string) => {
    setEditablePlan(prev => prev.map(item => {
      if (item.id === id) {
        const updated = !item.adicionado;
        setToastMsg(updated ? `Ação "${item.objetivo}" adicionada ao PDI!` : `Ação mantida no plano sugerido.`);
        setTimeout(() => setToastMsg(null), 3000);
        return { ...item, adicionado: updated };
      }
      return item;
    }));
  };

  const handleStartEditing = (action: EditablePDIAction) => {
    setEditingId(action.id);
    setEditingValues({
      objetivo: action.objetivo,
      acao: action.acao,
      prazo: action.prazo,
      evidencia: action.evidencia,
      prioridade: action.prioridade
    });
  };

  const handleSaveEditing = (id: string) => {
    setEditablePlan(prev => prev.map(item => item.id === id ? { ...item, ...editingValues } : item));
    setEditingId(null);
    setEditingValues({});
    setToastMsg('Ação do PDI atualizada com sucesso!');
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleConfirmValidation = () => {
    const milestoneName = selectedMilestone || (member?.pdiGoal || (member?.pdiHistory?.[0]?.treinamento_nome || 'Objetivo PDI'));
    setToastMsg(`Marco de PDI "${milestoneName}" de ${member?.name} validado com sucesso!`);
    setIsValidationModalOpen(false);
    setValidationNotes('');
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Helper for SVG Radar Points
  const getRadarCoordinates = (items: CompetenciaBarData[], radius: number, center: number) => {
    const total = items.length;
    const angleStep = (2 * Math.PI) / total;
    
    const pointsAtual = items.map((item, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = (item.atual / 5.0) * radius;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    }).join(' ');

    const pointsEsperado = items.map((item, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = (item.esperado / 5.0) * radius;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    }).join(' ');

    return { pointsAtual, pointsEsperado };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-950/65 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Main Panel Drawer */}
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-2xl animate-in zoom-in-95 duration-200 z-10">

        {/* Top Header Bar */}
        <div className="shrink-0 bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950 px-8 pt-7 pb-6 relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-72 h-72 bg-purple-600/10 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/10 blur-3xl rounded-full pointer-events-none" />

          {/* Toast Notification */}
          {toastMsg && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white font-black text-xs px-4 py-2 rounded-full shadow-lg border border-emerald-400 animate-in fade-in zoom-in z-50 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{toastMsg}</span>
            </div>
          )}

          {/* Top row controls */}
          <div className="flex justify-between items-start mb-5 relative z-10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-300" />
              <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest">
                Inteligência de PDI com IA & Explicabilidade
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Collaborator profile header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/20 shrink-0 shadow-md">
                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white leading-snug flex items-center gap-2">
                  {member.name}
                  <span className="text-[10px] font-black bg-white/10 text-gray-300 px-2.5 py-0.5 rounded-full border border-white/10">
                    {member.level}
                  </span>
                </h2>
                <p className="text-gray-300 text-xs font-medium mt-0.5">{member.role}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${colors.badge}`}>
                    {statusLabel}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">
                    Gerado em {today}
                  </span>
                </div>
              </div>
            </div>

            {/* Score box */}
            <div className="shrink-0 text-center bg-white/10 border border-white/10 rounded-2xl px-6 py-3 min-w-[140px]">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Progresso PDI</p>
              <p className={`text-3xl font-black ${colors.text}`}>{member.pdiAverage}%</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 relative z-10">
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${member.pdiAverage}%`, backgroundColor: getDynamicProgressColor(member.pdiAverage) }}
              />
            </div>
          </div>
        </div>

        {/* ── DISCLAIMER GERAL BAR ────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white border-b border-purple-100/80 px-8 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shrink-0">
          <div className="space-y-0.5">
            <span className="font-extrabold text-purple-900 flex items-center gap-1.5 text-xs">
              <Info className="w-4 h-4 text-purple-600" />
              Sobre esta análise
            </span>
            <p className="text-gray-600 font-medium leading-relaxed text-[11px]">
              A análise de PDI utiliza os dados disponíveis na plataforma para identificar necessidades de desenvolvimento, padrões de competências e prioridades. As recomendações apoiam o gestor e não substituem sua avaliação direta.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setSelectedMilestone(member.pdiGoal || (member.pdiHistory?.[0]?.treinamento_nome || 'Objetivo PDI'));
                setIsValidationModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-3.5 rounded-xl transition-all shadow-sm shrink-0 active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              Validar Marco
            </button>
            <button
              onClick={openMethodologyModal}
              className="bg-white hover:bg-purple-100/60 border border-purple-200 text-purple-700 font-extrabold text-xs py-2 px-3.5 rounded-xl transition-all shadow-sm shrink-0 active:scale-95 flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
              Entenda a análise
            </button>
          </div>
        </div>

        {/* ── SCROLLABLE BODY ─────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex-1 p-12 text-center text-gray-400 font-bold space-y-3">
            <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">Sintetizando inteligência de PDI para {member.name.split(' ')[0]}...</p>
          </div>
        ) : analysisData ? (
          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50/40 text-xs">

            {/* 1. SÍNTESE DO PDI (EXECUTIVE SUMMARY) */}
            <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-purple-600" />
              <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Síntese do PDI
              </span>
              <p className="text-gray-800 text-sm font-semibold leading-relaxed">
                {analysisData.sintese}
              </p>
            </div>

            {/* 2. LEITURA DO DESENVOLVIMENTO (NARRATIVA INDIVIDUAL) */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <User className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Leitura do Desenvolvimento</h3>
              </div>
              <div className="space-y-3 text-gray-600 font-medium leading-relaxed text-xs">
                {analysisData.leituraDesenvolvimento.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </div>

            {/* 3. EVIDÊNCIAS VISUAIS DA ANÁLISE (GRÁFICOS ANALÍTICOS CONDICIONAIS) */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                    Evidências Visuais da Análise
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-gray-400">
                  Visualizações baseadas nos dados estruturados da plataforma
                </span>
              </div>

              {/* GRÁFICO 1: COMPETÊNCIAS ATUAL × ESPERADO */}
              {analysisData.competenciasBarChart && analysisData.competenciasBarChart.length > 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wide">
                        Competências: Atual × Esperado para o Cargo
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Comparativo direto entre a avaliação observada e as expectativas corporativas.
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-bold">
                      <span className="flex items-center gap-1.5 text-purple-700">
                        <span className="w-3 h-3 rounded-sm bg-purple-600 inline-block" />
                        Nível Atual
                      </span>
                      <span className="flex items-center gap-1.5 text-indigo-700">
                        <span className="w-3 h-3 rounded-sm bg-indigo-300 inline-block" />
                        Nível Esperado (Cargo)
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar Chart */}
                  <div className="space-y-3 pt-2">
                    {analysisData.competenciasBarChart.map((cBar, idx) => (
                      <div
                        key={idx}
                        className="space-y-1.5 p-2.5 rounded-2xl hover:bg-purple-50/40 transition-colors relative"
                        onMouseEnter={() => setHoveredBarIndex(idx)}
                        onMouseLeave={() => setHoveredBarIndex(null)}
                      >
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-gray-900">{cBar.competencia}</span>
                          <span className="text-[10px] text-gray-500 font-semibold">
                            Atual: <strong className="text-purple-700 font-extrabold">{cBar.atual.toFixed(1)}</strong> / Esperado: <strong className="text-indigo-700 font-extrabold">{cBar.esperado.toFixed(1)}</strong> (Gap: <span className={cBar.gap < 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>{cBar.gap > 0 ? `+${cBar.gap.toFixed(1)}` : cBar.gap.toFixed(1)}</span>)
                          </span>
                        </div>

                        {/* Dual Bar track */}
                        <div className="space-y-1">
                          {/* Atual bar */}
                          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-700"
                              style={{ width: `${(cBar.atual / 5.0) * 100}%` }}
                            />
                          </div>
                          {/* Esperado bar */}
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-indigo-300 transition-all duration-700"
                              style={{ width: `${(cBar.esperado / 5.0) * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Tooltip hover card */}
                        {hoveredBarIndex === idx && (
                          <div className="absolute right-4 top-0 bg-gray-900 text-white p-3 rounded-xl shadow-xl z-20 text-[10px] space-y-1 border border-gray-700 animate-in fade-in">
                            <p className="font-extrabold text-purple-300">{cBar.competencia}</p>
                            <p>Avaliação Atual: <strong>{cBar.atual.toFixed(1)}</strong></p>
                            <p>Exigência do Cargo: <strong>{cBar.esperado.toFixed(1)}</strong></p>
                            <p>Diferença / Gap: <strong className={cBar.gap < 0 ? 'text-rose-400' : 'text-emerald-400'}>{cBar.gap.toFixed(1)}</strong></p>
                            <p>Prioridade de PDI: <strong>{cBar.prioridade}</strong></p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Interpretation box */}
                  <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 space-y-2 text-xs">
                    <p className="text-purple-950 font-semibold">
                      📌 <strong>O que o gráfico mostra:</strong> {analysisData.barChartInterpretacao.oQueMostra}
                    </p>
                    <p className="text-purple-900 font-medium">
                      💡 <strong>Por que isso importa:</strong> {analysisData.barChartInterpretacao.porQueImporta}
                    </p>
                  </div>
                </div>
              ) : null}

              {/* GRÁFICO 2: RADAR SVG (Condicional apenas se existirem 5+ competências) */}
              {analysisData.competenciasBarChart && analysisData.competenciasBarChart.length >= 5 ? (
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wide">
                        Perfil de Competências (Gráfico de Radar)
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Formato multidimensional do perfil em relação aos requisitos do cargo.
                      </p>
                    </div>
                    <span className="text-[10px] font-extrabold bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full border border-purple-200">
                      5+ Competências Mapeadas
                    </span>
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-center gap-6 py-4">
                    {/* SVG Radar */}
                    <div className="relative w-64 h-64 shrink-0">
                      <svg viewBox="0 0 200 200" className="w-full h-full">
                        {/* Web background circles */}
                        {[0.2, 0.4, 0.6, 0.8, 1.0].map((level, lIdx) => (
                          <circle
                            key={lIdx}
                            cx="100"
                            cy="100"
                            r={80 * level}
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="1"
                            strokeDasharray={lIdx < 4 ? "2 2" : "none"}
                          />
                        ))}
                        {/* Polygonal overlay */}
                        {(() => {
                          const { pointsAtual, pointsEsperado } = getRadarCoordinates(analysisData.competenciasBarChart, 80, 100);
                          return (
                            <>
                              <polygon points={pointsEsperado} fill="rgba(165, 180, 252, 0.2)" stroke="#818cf8" strokeWidth="2" strokeDasharray="3 3" />
                              <polygon points={pointsAtual} fill="rgba(147, 51, 234, 0.25)" stroke="#9333ea" strokeWidth="2.5" />
                            </>
                          );
                        })()}
                      </svg>
                    </div>

                    <div className="space-y-2 text-xs text-gray-600">
                      <p className="font-bold text-gray-900">Como interpretar a silhueta:</p>
                      <p>• A linha pontilhada azul representa o contorno esperado para a função.</p>
                      <p>• A área roxa preenchida representa a cobertura real demonstrada pelo colaborador.</p>
                      <p>• Variações em pontas específicas destacam competências que exigem alinhamento prático.</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* GRÁFICO 3: MATRIZ 2X2 — IMPACTO × NECESSIDADE DE DESENVOLVIMENTO */}
              {analysisData.matrizImpactoNecessidade && analysisData.matrizImpactoNecessidade.length > 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wide">
                        Matriz: Impacto × Necessidade de Desenvolvimento
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Priorização estratégica cruzando Relevância do Cargo × Gap de Competência.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {analysisData.matrizImpactoNecessidade.map((mItem, mIdx) => (
                      <div
                        key={mIdx}
                        className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100 space-y-1.5 relative hover:border-purple-200 transition-colors"
                        onMouseEnter={() => setHoveredMatrixIndex(mIdx)}
                        onMouseLeave={() => setHoveredMatrixIndex(null)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-gray-900 text-xs">{mItem.competencia}</span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${mItem.badgeCor}`}>
                            {mItem.classificacao}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-500">
                          <span>Relevância para o Cargo: <strong className="text-gray-800">{mItem.relevanciaCargo.toFixed(1)}</strong></span>
                          <span>Necessidade (Gap): <strong className="text-gray-800">{mItem.necessidadeGap.toFixed(1)}</strong></span>
                        </div>

                        {hoveredMatrixIndex === mIdx && (
                          <div className="absolute right-3 top-2 bg-gray-900 text-white p-2.5 rounded-xl shadow-lg z-20 text-[10px] space-y-0.5 animate-in fade-in">
                            <p className="font-black text-purple-300">{mItem.competencia}</p>
                            <p>Status: {mItem.classificacao}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* GRÁFICO 4: PROGRESSO DO PDI */}
              {analysisData.progressoPDIDistribuicao ? (
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wide">
                        Progresso de Execução das Ações de PDI
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Status consolidado do cumprimento dos compromissos pactuados.
                      </p>
                    </div>
                    <span className="text-lg font-black text-purple-700">
                      {analysisData.progressoPDIDistribuicao.concluido}% Concluído
                    </span>
                  </div>

                  <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-700"
                      style={{ width: `${analysisData.progressoPDIDistribuicao.concluido}%` }}
                      title={`Concluído: ${analysisData.progressoPDIDistribuicao.concluido}%`}
                    />
                    <div
                      className="bg-amber-400 h-full transition-all duration-700"
                      style={{ width: `${analysisData.progressoPDIDistribuicao.emAndamento}%` }}
                      title={`Em Andamento: ${analysisData.progressoPDIDistribuicao.emAndamento}%`}
                    />
                  </div>

                  <div className="flex items-center gap-6 text-[10px] font-bold text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Concluído ({analysisData.progressoPDIDistribuicao.concluido}%)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      Em Andamento ({analysisData.progressoPDIDistribuicao.emAndamento}%)
                    </span>
                  </div>

                  <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 text-amber-950 font-medium leading-relaxed text-xs">
                    ⚠️ <strong>Interpretação do Progresso:</strong> {analysisData.progressoPDIDistribuicao.interpretacaoIA}
                  </div>
                </div>
              ) : null}

            </div>

            {/* 4. AUTOAVALIAÇÃO × AVALIAÇÃO DO GESTOR */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Autoavaliação × Avaliação do Gestor</h3>
                </div>
                <span className="text-[10px] font-bold text-gray-400">Escala de 1 a 5</span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-400 font-extrabold uppercase text-[10px] border-b border-gray-100">
                    <tr>
                      <th className="p-3.5">Competência Avaliada</th>
                      <th className="p-3.5 text-center">Autoavaliação</th>
                      <th className="p-3.5 text-center">Gestor</th>
                      <th className="p-3.5">Interpretação & Alinhamento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                    {analysisData.selfVsManager.map((item, idx) => (
                      <tr key={idx} className={item.temDivergencia ? 'bg-amber-50/30' : 'hover:bg-gray-50/50'}>
                        <td className="p-3.5 font-bold text-gray-900 flex items-center gap-2">
                          {item.temDivergencia && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Percepções divergentes" />
                          )}
                          {item.competencia}
                        </td>
                        <td className="p-3.5 text-center font-extrabold text-purple-700">{item.autoavaliacao.toFixed(1)}</td>
                        <td className="p-3.5 text-center font-extrabold text-indigo-700">{item.gestor.toFixed(1)}</td>
                        <td className="p-3.5 text-gray-600 leading-normal">
                          <p>{item.interpretacao}</p>
                          {item.temDivergencia && (
                            <span className="inline-block mt-1 text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                              💬 Ponto para conversa no 1:1
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. EVOLUÇÃO HISTÓRICA DE COMPETÊNCIAS */}
            {analysisData.historicoEvolucao && analysisData.historicoEvolucao.length > 1 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Evolução Histórica de Competências</h3>
                </div>

                <div className="flex items-center justify-around bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100 text-center">
                  {analysisData.historicoEvolucao.map((hist, hIdx) => (
                    <div key={hIdx} className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">{hist.ano}</span>
                      <span className="text-2xl font-black text-emerald-700 block">{hist.nota.toFixed(1)}</span>
                      <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Média do Ciclo
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-gray-600 font-medium leading-relaxed text-xs">
                  💡 <strong>O que mudou?</strong> {analysisData.historicoInterpretacao}
                </div>
              </div>
            ) : null}

            {/* 6. PRIORIDADES DE DESENVOLVIMENTO (GAPS COM EXPLICABILIDADE) */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4 text-rose-500" />
                  Prioridades Principais de Desenvolvimento (1–3 Focos)
                </h3>
                <span className="text-[10px] font-bold text-gray-400">Classificado por Impacto</span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {analysisData.prioridades.map((item) => (
                  <div key={item.id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4 relative">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border ${item.prioridadeCor}`}>
                          Prioridade {item.prioridade}
                        </span>
                        <h4 className="font-extrabold text-gray-900 text-sm">{item.competencia}</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${item.confiancaClass}`}>
                          Confiança: {item.confianca}
                        </span>
                        <button
                          onClick={() => openReasoningModal(item)}
                          className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-black px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 active:scale-95"
                        >
                          <HelpCircle className="w-3 h-3 text-purple-600" />
                          Como chegamos a essa conclusão?
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 space-y-1">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">O que foi identificado</span>
                        <p className="text-gray-700 font-semibold">{item.dadoObservado}</p>
                      </div>

                      <div className="bg-purple-50/50 p-3.5 rounded-2xl border border-purple-100 space-y-1">
                        <span className="text-[9px] font-black text-purple-700 uppercase tracking-wider block">Por que desenvolver isso agora?</span>
                        <p className="text-purple-950 font-semibold">{item.porQuePrioridade}</p>
                      </div>

                      <div className="bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100 space-y-1">
                        <span className="text-[9px] font-black text-blue-700 uppercase tracking-wider block">Impacto da Competência</span>
                        <p className="text-blue-950 font-medium">{item.impacto}</p>
                      </div>

                      <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-100 space-y-1">
                        <span className="text-[9px] font-black text-amber-800 uppercase tracking-wider block">Análise de Causa</span>
                        <p className="text-amber-950 font-medium">{item.causaProvavel}</p>
                      </div>
                    </div>

                    <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100 text-[11px] text-gray-700 font-medium space-y-1">
                      <span className="font-extrabold text-emerald-800 text-[10px] uppercase block">Evidências que sustentam:</span>
                      {item.evidencias.map((ev, eIdx) => (
                        <p key={eIdx} className="text-gray-600 font-semibold">• {ev}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 7. RECOMENDAÇÕES PRÁTICAS (MODELO 70-20-10) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                  Recomendações Práticas de Desenvolvimento (Modelo 70-20-10)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analysisData.recomendacoes702010.map((rec, rIdx) => (
                  <div key={rIdx} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border inline-block ${rec.tipoBadge}`}>
                        {rec.tipo}
                      </span>
                      <h4 className="font-extrabold text-gray-900 text-xs">{rec.competencia}</h4>
                      <p className="text-gray-600 text-[11px] font-medium leading-relaxed bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        🎯 <strong>Ação:</strong> {rec.acao}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-gray-100 text-[10px] font-semibold text-gray-500">
                      <div className="flex justify-between">
                        <span>Frequência:</span>
                        <span className="font-bold text-gray-800">{rec.frequencia}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Prazo Recomendado:</span>
                        <span className="font-bold text-gray-800">{rec.prazo}</span>
                      </div>
                      <div className="pt-1 text-[10px] text-emerald-700 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                        <strong>Evidência de Sucesso:</strong> {rec.evidenciaSucesso}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 8. CONEXÃO COM CARREIRA */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-950 rounded-3xl p-6 text-white shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Contexto de Evolução de Carreira
                </span>
                {onNavigateToCareer && (
                  <button
                    onClick={onNavigateToCareer}
                    className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl border border-white/20 transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <span>Ver análise de carreira</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-purple-100 font-medium leading-relaxed">
                {analysisData.contextoCarreira.texto}
              </p>
            </div>

            {/* 9. EVIDÊNCIAS UTILIZADAS & LIMITAÇÕES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fontes utilizadas */}
              <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-3">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-gray-500" />
                  Fontes de Dados Utilizadas
                </h4>
                <div className="space-y-1.5">
                  {analysisData.evidenciasUtilizadas.map((ev, iIdx) => (
                    <div key={iIdx} className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs">
                      <span className="font-bold text-gray-800 flex items-center gap-1.5">
                        <span className="text-emerald-600 font-black">✓</span>
                        {ev.fonte}
                      </span>
                      <span className="text-[10px] font-semibold text-gray-400">{ev.detalhe}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Limitações da análise */}
              <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-3">
                <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Limitações da Análise (Dados Ausentes)
                </h4>
                <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-100 space-y-2 text-amber-950 text-xs font-medium">
                  {analysisData.limitacoes.map((lim, lIdx) => (
                    <p key={lIdx}>• {lim}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* 10. PLANO DE AÇÃO SUGERIDO PELA IA (EDITÁVEL PELO GESTOR) */}
            <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                    PDI Sugerido pela IA (Editável pelo Gestor)
                  </h3>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                    Revise as metas e adicione diretamente ao plano formal do colaborador.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {editablePlan.map((act) => (
                  <div key={act.id} className="bg-gray-50/60 p-4 rounded-2xl border border-gray-100 space-y-3">
                    {editingId === act.id ? (
                      /* Editing form */
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editingValues.objetivo || ''}
                            onChange={e => setEditingValues(v => ({ ...v, objetivo: e.target.value }))}
                            className="p-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-900"
                            placeholder="Objetivo"
                          />
                          <input
                            type="text"
                            value={editingValues.prazo || ''}
                            onChange={e => setEditingValues(v => ({ ...v, prazo: e.target.value }))}
                            className="p-2 border border-gray-300 rounded-lg text-xs text-gray-700"
                            placeholder="Prazo"
                          />
                        </div>
                        <input
                          type="text"
                          value={editingValues.acao || ''}
                          onChange={e => setEditingValues(v => ({ ...v, acao: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg text-xs text-gray-700"
                          placeholder="Ação Prática"
                        />
                        <input
                          type="text"
                          value={editingValues.evidencia || ''}
                          onChange={e => setEditingValues(v => ({ ...v, evidencia: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg text-xs text-gray-700"
                          placeholder="Evidência de Sucesso"
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleSaveEditing(act.id)}
                            className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" />
                            Salvar
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display action item */
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded uppercase">
                              Prioridade {act.prioridade}
                            </span>
                            <h4 className="font-extrabold text-gray-900 text-xs">{act.objetivo}</h4>
                          </div>
                          <p className="text-gray-600 text-[11px] font-medium">Ação: {act.acao}</p>
                          <div className="flex flex-wrap gap-4 text-[10px] text-gray-400 font-semibold pt-1">
                            <span>Prazo: <strong className="text-gray-700">{act.prazo}</strong></span>
                            <span>Indicador: <strong className="text-gray-700">{act.evidencia}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleStartEditing(act)}
                            className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                            title="Editar ação"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleAddAction(act.id)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all border shadow-sm active:scale-95 flex items-center gap-1.5 ${
                              act.adicionado
                                ? 'bg-emerald-500 text-white border-emerald-600'
                                : 'bg-white hover:bg-purple-50 text-purple-700 border-purple-200'
                            }`}
                          >
                            {act.adicionado ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                Adicionado ao PDI
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                Adicionar ao PDI
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 11. DISCLAIMER FINAL */}
            <div className="bg-gray-100 border border-gray-200 p-4 rounded-2xl text-[10px] text-gray-500 font-semibold leading-normal">
              <strong>Importante:</strong> Esta análise representa uma interpretação dos dados disponíveis na plataforma e tem como objetivo apoiar a construção e o acompanhamento do PDI. As recomendações não representam decisões automáticas sobre desempenho, promoção ou carreira. O contexto profissional do colaborador e a avaliação do gestor continuam sendo fundamentais para a definição do plano.
            </div>

          </div>
        ) : null}

        {/* Explainability / Reasoning Modal */}
        <ExplainabilityModal
          isOpen={explainModalOpen}
          onClose={() => setExplainModalOpen(false)}
          data={explainData}
        />

        {/* Modal de Validação de Marco de PDI */}
        {isValidationModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsValidationModalOpen(false)} />
            <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg p-6 space-y-5 z-10 animate-in zoom-in-95">
              <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    Validação Formal de Marco
                  </span>
                  <h3 className="text-base font-black text-gray-900 mt-1">Validar Marco de PDI — {member.name}</h3>
                </div>
                <button onClick={() => setIsValidationModalOpen(false)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Selecione o Marco / Objetivo</label>
                  <select
                    value={selectedMilestone || (member.pdiGoal || (member.pdiHistory?.[0]?.treinamento_nome || 'Objetivo PDI'))}
                    onChange={e => setSelectedMilestone(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {(member.pdiHistory?.length > 0 ? member.pdiHistory : [{ treinamento_nome: member.pdiGoal || 'Objetivo Principal' }]).map((t, idx) => (
                      <option key={idx} value={t.treinamento_nome}>{t.treinamento_nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Resultado da Aplicação no Dia a Dia</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Eficácia Comprovada', 'Em Progresso', 'Requer Ajustes'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setValidationStatus(st)}
                        className={`p-2.5 rounded-xl border text-[11px] font-bold text-center transition-all ${
                          validationStatus === st
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Comentários e Evidências do Gestor</label>
                  <textarea
                    rows={3}
                    value={validationNotes}
                    onChange={e => setValidationNotes(e.target.value)}
                    placeholder="Registre os fatos e evidências observadas no trabalho do colaborador (ex: conduziu alinhamento com sucesso, entregou projeto sem atrasos)..."
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => setIsValidationModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmValidation}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar Validação
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CollaboratorAnalysisPanel;
