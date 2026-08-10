import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ChevronRight, Zap, TrendingUp, ShieldAlert, Target, ShieldCheck, AlertTriangle, ArrowLeft, Briefcase, Users } from 'lucide-react';
import api from '../utils/api';
import CareerDetailPanel from './CareerDetailPanel';
import CollaboratorHoverCard, { type HoverCardData } from './CollaboratorHoverCard';

export interface CareerTraining {
  nome: string;
  conhecimento: string;
  aplicacao: string;
  desempenho: string;
  eficacia: string;
  data: string;
  carga_horaria: string;
  provedor: string;
}

export interface CompetenciaExigida {
  competencia: string;
  tipo: string;
  nivel: string;
}

export interface CareerMember {
  id: string;
  nome: string;
  cargo: string;
  departamento: string;
  superior_imediato?: string;
  nivel_cargo: string;
  data_admissao: string;
  avatar: string;
  nivel_escolaridade: string;
  curso_formacao: string;
  instituicao: string;
  idioma: string;
  nivel_idioma: string;
  anos_experiencia: number;
  competencia_tecnica_1: string;
  competencia_tecnica_2: string;
  competencia_tecnica_3: string;
  competencia_comportamental: string;
  competencia_comportamental_2: string;
  certificacoes: string;
  fit_cultural: string;
  mapa_sucessao: string;
  nivel_prontidao: string;
  risco_perda: string;
  impacto_saida: string;
  designacao_sucessao: string;
  potencial_crescimento: string;
  nota_desempenho: string;
  comentarios_gestor: string;
  treinamentos: CareerTraining[];
  competencias_exigidas: CompetenciaExigida[];
}

export interface HiddenTalentSignal {
  tipo: string;
  descricao: string;
  evidencias: string[];
  interpretacao: string;
  confianca: 'Alta' | 'Média' | 'Baixa';
}

export interface HiddenTalentResult {
  hasTalent: boolean;
  signals: HiddenTalentSignal[];
  suggestion: string;
  potentialAreas: string[];
  classificationName: string;
  reasons: string[];
  confirmations: string[];
  confidence: 'Alta' | 'Moderada' | 'Limitada' | 'Sem evidência suficiente';
  evidencesCount: number;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export const parseProntidao = (raw: string) => {
  if (!raw) return { label: 'Não avaliado', bg: 'bg-gray-100', border: 'border-gray-200', text: 'text-gray-500' };
  const label = raw.split(' - ')[0] || raw;
  if (/agora|imediata/i.test(raw)) return { label, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' };
  if (/6 meses/i.test(raw)) return { label, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' };
  if (/1.?2 anos|12 meses/i.test(raw)) return { label, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' };
  if (/desenvolviment/i.test(raw)) return { label, bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' };
  return { label, bg: 'bg-gray-100', border: 'border-gray-200', text: 'text-gray-500' };
};

export const parseShortLabel = (raw: string): string => raw?.split(' - ')[0] || raw || 'Não avaliado';

export const computeHiddenTalent = (m: CareerMember): HiddenTalentResult => {
  const signals: HiddenTalentSignal[] = [];
  const capacityEvidences: string[] = [];

  // Ev 1: High Readiness
  const isReadySoon = /agora|6 meses|imediata/i.test(m.nivel_prontidao);
  if (isReadySoon) {
    capacityEvidences.push(`Prontidão estimada de curto prazo: ${parseShortLabel(m.nivel_prontidao)}`);
  }

  // Ev 2: High Performance
  const perfNum = parseFloat(m.nota_desempenho);
  const isHighPerformance = (!isNaN(perfNum) && perfNum >= 4.0) || /alto|excelente|supera/i.test(m.nota_desempenho);
  if (isHighPerformance) {
    capacityEvidences.push(`Desempenho elevado registrado: ${m.nota_desempenho}`);
  }

  // Ev 3: Skills declared above current requirements
  const requiredNames = (m.competencias_exigidas || []).map(c => c.competencia.toLowerCase());
  const declaredSkills = [m.competencia_tecnica_1, m.competencia_tecnica_2, m.competencia_tecnica_3].filter(Boolean) as string[];
  const extraSkills = declaredSkills.filter(skill =>
    skill && !requiredNames.some(req =>
      req.includes(skill.toLowerCase()) || skill.toLowerCase().includes(req.split(' ')[0] || '')
    )
  );
  if (extraSkills.length > 0) {
    capacityEvidences.push(`Competência técnica adicional não exigida: "${extraSkills[0]}"`);
  }

  // Ev 4: Training effectiveness
  const hasEffectiveTrainings = (m.treinamentos || []).filter(t => t.eficacia === 'Sim').length >= 2;
  if (hasEffectiveTrainings) {
    capacityEvidences.push(`${m.treinamentos.filter(t => t.eficacia === 'Sim').length} treinamentos com eficácia comprovada`);
  }

  // Ev 5: Manager feedback favorable
  const isManagerFavorable = !!m.comentarios_gestor && /excelente|destaque|promissor|supera|evolução|crescimento|ótimo|alta capacidade|liderança|pronto/i.test(m.comentarios_gestor);
  if (isManagerFavorable) {
    capacityEvidences.push(`Avaliação do gestor favorável: "${m.comentarios_gestor.length > 40 ? m.comentarios_gestor.substring(0, 40) + '...' : m.comentarios_gestor}"`);
  }

  // Critério B: Potencial relevante
  const isHighPotential = /alto/i.test(m.potencial_crescimento);

  // Critério C: Desalinhamento com o reconhecimento atual (Não mapeado na sucessão)
  const isUnmapped = (!m.mapa_sucessao || /não/i.test(m.mapa_sucessao)) && (!m.designacao_sucessao || /nenhum|não/i.test(m.designacao_sucessao) || m.designacao_sucessao.trim() === '');

  // Critério D & E: Relevância & Evidências independentes (pelo menos duas)
  const isUnmappedTalent = isHighPotential && isUnmapped && capacityEvidences.length >= 2;

  // Hierarquia de Rótulos
  let classificationName = 'Sem classificação especial';
  let hasTalent = false;

  const isSuccessor = /sim|sucessor/i.test(m.mapa_sucessao) || (m.designacao_sucessao && m.designacao_sucessao.trim() !== '' && !/não|nenhum/i.test(m.designacao_sucessao));
  
  const isRecognizedTalent = !isSuccessor && isHighPotential && (isReadySoon || (m.mapa_sucessao && !/não/i.test(m.mapa_sucessao)));

  const isPotentialDevelopment = !isSuccessor && !isRecognizedTalent && !isUnmappedTalent && (isHighPotential || /médio|medio/i.test(m.potencial_crescimento) || isReadySoon || (!isNaN(perfNum) && perfNum >= 3.0));

  const isAlternativeTrajectory = !isSuccessor && !isRecognizedTalent && !isUnmappedTalent && !isPotentialDevelopment && (extraSkills.length > 0 || hasEffectiveTrainings);

  if (isSuccessor) {
    classificationName = 'Sucessor formal';
  } else if (isRecognizedTalent) {
    classificationName = 'Talento reconhecido';
  } else if (isUnmappedTalent) {
    classificationName = 'Possível talento não mapeado';
    hasTalent = true;
  } else if (isPotentialDevelopment) {
    classificationName = 'Potencial de desenvolvimento';
  } else if (isAlternativeTrajectory) {
    classificationName = 'Trajetória alternativa';
  }

  // Populate signals if they have unmapped talent or alternative trajectory to preserve structure
  if (isUnmappedTalent) {
    signals.push({
      tipo: 'Possível talento não mapeado',
      descricao: 'Demonstra alto potencial e prontidão ou desempenho elevado, porém não consta no planejamento sucessório.',
      evidencias: capacityEvidences,
      interpretacao: 'Os dados disponíveis apresentam sinais consistentes de capacidade para atuação em maior nível de complexidade, porém esse potencial ainda não aparece refletido no planejamento sucessório atual.',
      confianca: capacityEvidences.length >= 4 ? 'Alta' : 'Média'
    });
  } else if (isAlternativeTrajectory) {
    signals.push({
      tipo: 'Possível trajetória alternativa',
      descricao: 'Demonstra aderência técnica ou qualificações extras para outros contextos.',
      evidencias: capacityEvidences.length > 0 ? capacityEvidences : ['Histórico profissional/formação compatível'],
      interpretacao: 'Identificada possibilidade de trilha técnica (Especialista) ou mobilidade entre departamentos.',
      confianca: 'Média'
    });
  }

  const potentialAreas: string[] = [];
  if (extraSkills.length > 0) potentialAreas.push('Arquitetura & Especialização');
  if (isHighPotential) potentialAreas.push('Liderança & Sucessão');

  const confirmations = [
    'Avaliação específica de competências de liderança/complexidade superior',
    'Conversa de alinhamento de carreira e interesse para novas posições',
    'Validação prática de prontidão no cargo atual'
  ];

  let confidence: 'Alta' | 'Moderada' | 'Limitada' | 'Sem evidência suficiente' = 'Sem evidência suficiente';
  if (capacityEvidences.length >= 4) {
    confidence = 'Alta';
  } else if (capacityEvidences.length >= 2) {
    confidence = 'Moderada';
  } else if (capacityEvidences.length === 1) {
    confidence = 'Limitada';
  }

  return {
    hasTalent,
    signals,
    suggestion: isUnmappedTalent
      ? `A análise identificou uma combinação incomum entre prontidão elevada, desempenho favorável e aderência às competências de uma posição superior, apesar de o colaborador ainda não estar formalmente identificado no mapa de sucessão.`
      : (isRecognizedTalent ? 'Perfil de talento reconhecido pela organização.' : 'Perfil alinhado à trajetória atual ou com potencial de desenvolvimento padrão.'),
    potentialAreas: potentialAreas.length > 0 ? potentialAreas : ['Desenvolvimento no Cargo'],
    classificationName,
    reasons: capacityEvidences,
    confirmations,
    confidence,
    evidencesCount: capacityEvidences.length
  };
};

const CareerMap: React.FC<{ search: string, managerId: string }> = ({ search, managerId }) => {
  const [members, setMembers] = useState<CareerMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<CareerMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<CareerMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterRole, setRoleFilter] = useState<string | null>(null);

  // Hover Card State
  const [hoverData, setHoverData] = useState<HoverCardData | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [isHoverVisible, setIsHoverVisible] = useState(false);
  const hideTimerRef = useRef<any>(null);

  useEffect(() => {
    fetchCareerMap();
  }, [managerId]);

  const fetchCareerMap = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/career-map?managerId=${managerId}`);
      setMembers(response.data);
      setFilteredMembers(response.data);
    } catch (error) {
      console.error("Failed to fetch career map data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let result = members.filter(m =>
      m.nome.toLowerCase().includes(search.toLowerCase()) ||
      m.cargo.toLowerCase().includes(search.toLowerCase()) ||
      m.departamento.toLowerCase().includes(search.toLowerCase()) ||
      (m.curso_formacao && m.curso_formacao.toLowerCase().includes(search.toLowerCase())) ||
      (m.competencia_tecnica_1 && m.competencia_tecnica_1.toLowerCase().includes(search.toLowerCase()))
    );

    if (filterCategory === 'successors') {
      result = result.filter(m => computeHiddenTalent(m).classificationName === 'Sucessor formal');
    } else if (filterCategory === 'strategic_talents') {
      result = result.filter(m => computeHiddenTalent(m).classificationName === 'Talento reconhecido');
    } else if (filterCategory === 'high_potential') {
      result = result.filter(m => computeHiddenTalent(m).classificationName === 'Potencial de desenvolvimento');
    } else if (filterCategory === 'hidden_talents') {
      result = result.filter(m => computeHiddenTalent(m).classificationName === 'Possível talento não mapeado');
    } else if (filterCategory === 'high_risk') {
      result = result.filter(m => /alto/i.test(m.risco_perda) && /alto/i.test(m.impacto_saida));
    } else if (filterCategory === 'all') {
      // no filter
    }

    if (filterRole && filterRole !== 'ALL') {
      result = result.filter(m => m.cargo === filterRole);
    }

    setFilteredMembers(result);
  }, [search, members, filterCategory, filterRole]);

  // Methodology Modal State
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // Hover Card Handlers
  const handleCardMouseEnter = (m: CareerMember, event: React.MouseEvent<HTMLElement>) => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    const rect = event.currentTarget.getBoundingClientRect();
    setAnchorRect(rect);
    setHoverData({
      id: m.id,
      name: m.nome,
      role: m.cargo,
      department: m.departamento,
      superior_imediato: m.superior_imediato || 'Gestor Logado',
      pdiAverage: 80,
      alignmentScore: 85,
      evaluationStatus: parseShortLabel(m.nivel_prontidao),
      goalsCount: m.competencias_exigidas?.length || 3,
      actionsCount: m.treinamentos?.length || 2,
      avatar: m.avatar
    });
    setIsHoverVisible(true);
  };

  const handleCardMouseLeave = () => {
    hideTimerRef.current = setTimeout(() => {
      setIsHoverVisible(false);
    }, 150);
  };

  // Team Aggregation Metrics
  const totalTeam = members.length;
  const strategicTalents = members.filter(m => computeHiddenTalent(m).classificationName === 'Talento reconhecido').length;
  const successorsCount = members.filter(m => computeHiddenTalent(m).classificationName === 'Sucessor formal').length;
  const highPotentialCount = members.filter(m => computeHiddenTalent(m).classificationName === 'Potencial de desenvolvimento').length;
  const hiddenTalentsCount = members.filter(m => computeHiddenTalent(m).classificationName === 'Possível talento não mapeado').length;
  const highRiskCount = members.filter(m => /alto/i.test(m.risco_perda) && /alto/i.test(m.impacto_saida)).length;


  // Check 9-box matrix data availability
  const membersWithPerformanceAndPotential = members.filter(m => m.nota_desempenho && m.potencial_crescimento);
  const isNineBoxAvailable = membersWithPerformanceAndPotential.length >= 2;

  // Filter members by category
  const membersInSelectedCategory = React.useMemo(() => {
    if (!filterCategory) return [];
    let result = members;
    if (filterCategory === 'successors') {
      result = result.filter(m => computeHiddenTalent(m).classificationName === 'Sucessor formal');
    } else if (filterCategory === 'strategic_talents') {
      result = result.filter(m => computeHiddenTalent(m).classificationName === 'Talento reconhecido');
    } else if (filterCategory === 'high_potential') {
      result = result.filter(m => computeHiddenTalent(m).classificationName === 'Potencial de desenvolvimento');
    } else if (filterCategory === 'hidden_talents') {
      result = result.filter(m => computeHiddenTalent(m).classificationName === 'Possível talento não mapeado');
    } else if (filterCategory === 'high_risk') {
      result = result.filter(m => /alto/i.test(m.risco_perda) && /alto/i.test(m.impacto_saida));
    } else if (filterCategory === 'all') {
      result = members;
    }
    return result;
  }, [members, filterCategory]);

  const rolesInSelectedCategory = React.useMemo(() => {
    if (!filterCategory) return [];
    const groups: { [key: string]: CareerMember[] } = {};
    membersInSelectedCategory.forEach(m => {
      const role = m.cargo || 'Não Definido';
      if (!groups[role]) groups[role] = [];
      groups[role].push(m);
    });
    return Object.keys(groups).map(roleName => ({
      roleName,
      members: groups[roleName]
    })).sort((a, b) => b.members.length - a.members.length);
  }, [membersInSelectedCategory, filterCategory]);

  const getCategoryName = (cat: string | null) => {
    if (cat === 'strategic_talents') return '🌟 Talentos Reconhecidos';
    if (cat === 'successors') return '👑 Sucessores';
    if (cat === 'high_potential') return '📈 Potencial de Desenvolvimento';
    if (cat === 'hidden_talents') return '🔎 Possíveis Talentos Não Mapeados';
    if (cat === 'high_risk') return '⚠️ Alto Risco';
    if (cat === 'all') return 'Toda a Equipe';
    return '';
  };

  const handleCategoryClick = (cat: string) => {
    setFilterCategory(filterCategory === cat ? null : cat);
    setRoleFilter(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Detail Drawer */}
      <CareerDetailPanel
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />

      {/* Floating Hover Card */}
      <CollaboratorHoverCard
        data={hoverData}
        anchorRect={anchorRect}
        isVisible={isHoverVisible}
        onMouseEnter={() => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); }}
        onMouseLeave={handleCardMouseLeave}
      />

      {/* Methodology Modal */}
      {isMethodologyOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/65 backdrop-blur-sm animate-in fade-in duration-200 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-2xl w-full p-6 space-y-5 animate-in zoom-in-95 text-xs">
            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center font-black">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Como funciona a Inteligência de Carreira?</h3>
                  <span className="text-[10px] text-gray-400 font-bold">Metodologia de Rastreabilidade e Auditoria</span>
                </div>
              </div>
              <button onClick={() => setIsMethodologyOpen(false)} className="p-2 rounded-xl text-gray-400 hover:text-gray-700">✕</button>
            </div>

            <div className="space-y-3 leading-relaxed text-gray-600 font-medium">
              <p>
                As análises da aba <strong>Carreira</strong> utilizam os dados estruturados cadastrados na plataforma (como avaliações de gestor, prontidão, competências requeridas, histórico de treinamentos e sucessão) para identificar padrões de potencial e produzir <strong>leituras profundas de carreira</strong>.
              </p>
              <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 space-y-2 text-purple-950 font-bold">
                <span className="text-[10px] uppercase tracking-wider block text-purple-700">Estrutura de Explicabilidade:</span>
                <p className="text-[11px]">CONCLUSÃO → EVIDÊNCIAS → TRADUÇÃO GERENCIAL → LIMITAÇÕES → AÇÃO NO PDI</p>
              </div>
              <ul className="space-y-1.5 list-disc pl-4 text-[11px]">
                <li><strong>Análises com evidências parciais:</strong> A ausência de um campo específico (ex: desempenho) não invalida os demais sinais observados. A IA gera uma interpretação útil classificada como <em>Confiança Moderada</em>, apontando explicitamente as ressalvas.</li>
                <li><strong>Apoio técnico à decisão:</strong> As leituras orientam o diálogo entre gestor e liderado, sem automatizar promoções ou movimentações.</li>
                <li><strong>Rastreabilidade total:</strong> Cada indicador possui o botão <em>"Como chegamos a essa conclusão?"</em> com a matriz de impacto dos fatos observados.</li>
              </ul>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setIsMethodologyOpen(false)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md text-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            Inteligência de Carreira e Talentos
            <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold border border-purple-200">
              Gestão de Potencial
            </span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm font-medium max-w-3xl">
            Análise estruturada do perfil profissional, mapa de sucessão, alinhamento de competências, talentos ocultos e trilhas de evolução da sua equipe.
          </p>
        </div>
      </div>

      {/* Disclaimer Geral */}
      <div className="bg-gradient-to-r from-purple-50/90 via-primary-50/40 to-white border border-purple-100 shadow-sm p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-xs space-y-1">
          <span className="font-extrabold text-purple-900 flex items-center gap-1.5 text-xs">
            <Sparkles className="w-4 h-4 text-purple-600" />
            Sobre esta análise de inteligência
          </span>
          <p className="text-gray-600 font-medium max-w-3xl leading-relaxed text-[11px]">
            As análises são geradas a partir dos dados disponíveis na plataforma. A IA identifica padrões e possíveis caminhos de desenvolvimento como apoio à decisão do gestor, sem automatizar promoções ou movimentações.
          </p>
        </div>

        <button
          onClick={() => setIsMethodologyOpen(true)}
          className="bg-white hover:bg-purple-50 border border-purple-200 text-purple-700 font-extrabold text-xs py-2 px-3.5 rounded-xl transition-all shadow-sm active:scale-95 shrink-0"
        >
          Como essa análise funciona?
        </button>
      </div>

      {/* Matriz cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div
          onClick={() => handleCategoryClick('strategic_talents')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            filterCategory === 'strategic_talents' ? 'bg-purple-600 text-white border-purple-700 shadow-lg' : 'bg-white border-gray-100 shadow-sm hover:border-purple-200'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider ${filterCategory === 'strategic_talents' ? 'text-purple-100' : 'text-gray-400'}`}>
                Talentos Reconhecidos
              </span>
              <Sparkles className={`w-4 h-4 ${filterCategory === 'strategic_talents' ? 'text-yellow-300' : 'text-purple-600'}`} />
            </div>
            <span className="text-2xl font-black block mt-2">{strategicTalents}</span>
          </div>
          <span className={`text-[9px] font-bold block mt-2 ${filterCategory === 'strategic_talents' ? 'text-purple-200' : 'text-gray-400'}`}>
            Potencial já identificado
          </span>
        </div>

        <div
          onClick={() => handleCategoryClick('successors')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            filterCategory === 'successors' ? 'bg-emerald-600 text-white border-emerald-700 shadow-lg' : 'bg-white border-gray-100 shadow-sm hover:border-emerald-200'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider ${filterCategory === 'successors' ? 'text-emerald-100' : 'text-gray-400'}`}>
                Sucessores
              </span>
              <ShieldCheck className={`w-4 h-4 ${filterCategory === 'successors' ? 'text-white' : 'text-emerald-600'}`} />
            </div>
            <span className="text-2xl font-black block mt-2">{successorsCount}</span>
          </div>
          <span className={`text-[9px] font-bold block mt-2 ${filterCategory === 'successors' ? 'text-emerald-200' : 'text-gray-400'}`}>
            Mapeados para sucessão
          </span>
        </div>

        <div
          onClick={() => handleCategoryClick('high_potential')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            filterCategory === 'high_potential' ? 'bg-blue-600 text-white border-blue-700 shadow-lg' : 'bg-white border-gray-100 shadow-sm hover:border-blue-200'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider ${filterCategory === 'high_potential' ? 'text-blue-100' : 'text-gray-400'}`}>
                Potencial de Desenvolvimento
              </span>
              <TrendingUp className={`w-4 h-4 ${filterCategory === 'high_potential' ? 'text-white' : 'text-blue-600'}`} />
            </div>
            <span className="text-2xl font-black block mt-2">{highPotentialCount}</span>
          </div>
          <span className={`text-[9px] font-bold block mt-2 ${filterCategory === 'high_potential' ? 'text-blue-200' : 'text-gray-400'}`}>
            Perspectiva de evolução
          </span>
        </div>

        <div
          onClick={() => handleCategoryClick('hidden_talents')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            filterCategory === 'hidden_talents' ? 'bg-amber-500 text-white border-amber-600 shadow-lg' : 'bg-white border-gray-100 shadow-sm hover:border-amber-200'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider ${filterCategory === 'hidden_talents' ? 'text-amber-100' : 'text-gray-400'}`}>
                Possíveis talentos não mapeados
              </span>
              <Zap className={`w-4 h-4 ${filterCategory === 'hidden_talents' ? 'text-yellow-200' : 'text-amber-500'}`} />
            </div>
            <span className="text-2xl font-black block mt-2">{hiddenTalentsCount}</span>
          </div>
          <span className={`text-[9px] font-bold block mt-2 ${filterCategory === 'hidden_talents' ? 'text-amber-100' : 'text-gray-400'}`}>
            Oportunidade de investigação
          </span>
        </div>

        <div
          onClick={() => handleCategoryClick('high_risk')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            filterCategory === 'high_risk' ? 'bg-rose-600 text-white border-rose-700 shadow-lg' : 'bg-white border-gray-100 shadow-sm hover:border-rose-200'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider ${filterCategory === 'high_risk' ? 'text-rose-100' : 'text-gray-400'}`}>
                Risco Elevado
              </span>
              <ShieldAlert className={`w-4 h-4 ${filterCategory === 'high_risk' ? 'text-white' : 'text-rose-600'}`} />
            </div>
            <span className="text-2xl font-black block mt-2">{highRiskCount}</span>
          </div>
          <span className={`text-[9px] font-bold block mt-2 ${filterCategory === 'high_risk' ? 'text-rose-200' : 'text-gray-400'}`}>
            Risco de perda + Impacto
          </span>
        </div>
      </div>

      {/* ── 2. CAMADA 1: OVERVIEW INICIAL (SEM CATEGORIA SELECIONADA) ───────────────── */}
      {filterCategory === null ? (
        <div className="space-y-6">
          {/* Matriz 9-Box */}
          <div className="bg-white border border-gray-100 shadow-sm p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-extrabold text-gray-900">Matriz Potencial × Desempenho (9-Box)</h3>
              </div>
              {!isNineBoxAvailable && (
                <span className="text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Matriz indisponível — dados insuficientes
                </span>
              )}
            </div>

            {isNineBoxAvailable ? (
              <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
                <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                  <span className="font-extrabold text-purple-700 block text-[11px]">Enigma / Desenvolver</span>
                  <span className="text-gray-500 text-[10px]">Alto Potencial · Desempenho Baixo</span>
                </div>
                <div className="bg-purple-100 p-3 rounded-xl border border-purple-200">
                  <span className="font-extrabold text-purple-800 block text-[11px]">Forte Desempenho</span>
                  <span className="text-purple-700 text-[10px]">Alto Potencial · Desempenho Médio</span>
                </div>
                <div className="bg-emerald-100 p-3 rounded-xl border border-emerald-300 shadow-sm">
                  <span className="font-black text-emerald-800 block text-[11px]">🌟 TALENTOS ESTRATÉGICOS</span>
                  <span className="text-emerald-700 text-[10px]">Alto Potencial · Alto Desempenho</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 font-medium">
                Para habilitar o mapeamento 9-Box completo, certifique-se de que a planilha de avaliações contenha a avaliação de desempenho e potencial preenchidas para os liderados.
              </p>
            )}
          </div>

          {/* Call to Action card */}
          <div className="bg-gray-50/50 border border-dashed border-gray-200 p-10 rounded-3xl text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900">Selecione uma categoria para explorar a equipe</h3>
            <p className="text-gray-500 text-xs font-medium max-w-md mx-auto leading-relaxed">
              Clique em qualquer um dos 5 cards de inteligência acima para detalhar os cargos e os liderados associados a essa classificação de talento.
            </p>
            <button
              onClick={() => { setFilterCategory('all'); setRoleFilter(null); }}
              className="mt-2 inline-flex items-center gap-2 text-xs font-extrabold text-purple-600 bg-white border border-purple-200 px-4 py-2.5 rounded-xl hover:bg-purple-50 transition-all shadow-sm active:scale-95"
            >
              <span>Ou visualizar toda a equipe ({totalTeam} colaboradores)</span>
            </button>
          </div>
        </div>

      /* ── 3. CAMADA 2: CATEGORIA SELECIONADA -> DIVISÃO POR CARGO ────────────────── */
      ) : filterCategory !== null && filterRole === null ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFilterCategory(null)}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao Overview
              </button>
              <span className="text-xs font-black text-gray-950 uppercase tracking-wider">
                Grupo: {getCategoryName(filterCategory)}
              </span>
            </div>

            <button
              onClick={() => setRoleFilter('ALL')}
              className="text-xs font-extrabold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3.5 py-2 rounded-xl transition-all"
            >
              Ver todos do grupo ({membersInSelectedCategory.length}) →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rolesInSelectedCategory.map(roleItem => (
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
                          Cargo na categoria
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 flex justify-between items-center text-xs my-4">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Colaboradores</span>
                    <span className="text-sm font-black text-gray-900">{roleItem.members.length}</span>
                  </div>
                </div>

                <button
                  onClick={() => setRoleFilter(roleItem.roleName)}
                  className="w-full mt-2 flex items-center justify-between bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white font-extrabold text-xs py-2.5 px-4 rounded-xl border border-purple-100 transition-all active:scale-95 group-hover:bg-purple-600 group-hover:text-white"
                >
                  <span>Ver Pessoas em {roleItem.roleName}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

      /* ── 4. CAMADA 3: CARGO SELECIONADO -> LISTA DE COLABORADORES ────────────────── */
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white border border-gray-100 shadow-sm p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setRoleFilter(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all border border-gray-200 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar aos Cargos
              </button>
              <span className="text-xs font-black text-gray-900 bg-purple-50 border border-purple-100 px-3 py-1 rounded-full">
                Grupo: {getCategoryName(filterCategory)}
              </span>
              <span className="text-xs font-black text-gray-900 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
                Cargo: {filterRole === 'ALL' ? 'Todos os Cargos' : filterRole}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full py-16 text-center text-gray-400 font-bold">Carregando mapa de carreiras da equipe...</div>
            ) : filteredMembers.length === 0 ? (
              <div className="col-span-full py-16 text-center text-gray-400 font-bold bg-white rounded-2xl border border-gray-100">
                Nenhum colaborador encontrado para os filtros selecionados.
              </div>
            ) : (
              filteredMembers.map((m) => {
                const prontidaoInfo = parseProntidao(m.nivel_prontidao);
                const hiddenTalents = computeHiddenTalent(m);
                const isStrategic = /alto/i.test(m.potencial_crescimento) && (/agora|6 meses|imediata/i.test(m.nivel_prontidao) || /sim|sucessor/i.test(m.mapa_sucessao));
                const isHighLossRisk = /alto/i.test(m.risco_perda) && /alto/i.test(m.impacto_saida);

                return (
                  <div
                    key={m.id}
                    onMouseEnter={(e) => handleCardMouseEnter(m, e)}
                    onMouseLeave={handleCardMouseLeave}
                    onClick={() => setSelectedMember(m)}
                    className="bg-white border border-gray-100 hover:border-purple-300 shadow-md hover:shadow-xl rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 cursor-pointer group hover:-translate-y-0.5 relative"
                  >
                    <div>
                      {/* Badges Bar */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {hiddenTalents.classificationName === 'Sucessor formal' && (
                          <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 uppercase tracking-wider">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Sucessor Identificado
                          </span>
                        )}

                        {hiddenTalents.classificationName === 'Talento reconhecido' && (
                          <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1 uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                            Talento Reconhecido
                          </span>
                        )}

                        {hiddenTalents.classificationName === 'Possível talento não mapeado' && (
                          <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 uppercase tracking-wider">
                            <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
                            Talento Não Mapeado
                          </span>
                        )}

                        {isHighLossRisk && (
                          <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 uppercase tracking-wider">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                            Prioridade Retenção
                          </span>
                        )}
                      </div>

                      {/* Collaborator info */}
                      <div className="flex items-start gap-3.5 mb-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 bg-gray-100 shrink-0 group-hover:ring-2 ring-purple-500 transition-all">
                          <img src={m.avatar} alt={m.nome} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-gray-900 text-base leading-snug group-hover:text-purple-600 transition-colors">
                            {m.nome}
                          </h3>
                          <p className="text-gray-400 text-xs font-medium">{m.cargo}</p>
                          <span className="text-[10px] text-gray-400 font-bold block mt-0.5">{m.departamento}</span>
                        </div>
                      </div>

                      {/* Career Metrics Grid */}
                      <div className="grid grid-cols-2 gap-2 my-4 bg-gray-50/80 p-3 rounded-xl border border-gray-100 text-xs">
                        <div>
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Potencial</span>
                          <span className="font-extrabold text-gray-800">{m.potencial_crescimento || 'Não avaliado'}</span>
                        </div>

                        <div>
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Prontidão</span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border inline-block mt-0.5 ${prontidaoInfo.bg} ${prontidaoInfo.text} ${prontidaoInfo.border}`}>
                            {prontidaoInfo.label}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-gray-100">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Sucessão</span>
                          <span className="font-extrabold text-gray-800">{parseShortLabel(m.mapa_sucessao)}</span>
                        </div>

                        <div className="pt-2 border-t border-gray-100">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Risco de Perda</span>
                          <span className="font-extrabold text-gray-800">{parseShortLabel(m.risco_perda)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Action Button */}
                    <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-xs font-extrabold text-purple-600 group-hover:text-purple-700">
                      <span>Abrir Inteligência de Carreira</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerMap;
