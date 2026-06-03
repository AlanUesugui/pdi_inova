import React, { useState, useEffect } from 'react';
import { Filter, Sparkles, ChevronRight, Zap, TrendingUp } from 'lucide-react';
import axios from 'axios';
import CareerDetailPanel from './CareerDetailPanel';

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
  dado: string;
}

export interface HiddenTalentResult {
  hasTalent: boolean;
  signals: HiddenTalentSignal[];
  suggestion: string;
  potentialAreas: string[];
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

export const parseShortLabel = (raw: string): string => raw?.split(' - ')[0] || raw || '—';

export const computeHiddenTalent = (m: CareerMember): HiddenTalentResult => {
  const signals: HiddenTalentSignal[] = [];
  const requiredNames = m.competencias_exigidas.map(c => c.competencia.toLowerCase());

  // Signal 1: Extra technical skills not in required list
  const declaredSkills = [m.competencia_tecnica_1, m.competencia_tecnica_2, m.competencia_tecnica_3].filter(Boolean) as string[];
  const extraSkills = declaredSkills.filter(skill =>
    skill && !requiredNames.some(req =>
      req.includes(skill.toLowerCase()) || skill.toLowerCase().includes(req.split(' ')[0] || '')
    )
  );
  if (extraSkills.length > 0) {
    signals.push({
      tipo: 'Competência técnica adicional',
      descricao: `Possui "${extraSkills[0]}" declarado no currículo — competência não exigida para o cargo atual.`,
      dado: extraSkills[0],
    });
  }

  // Signal 2: Good trainings outside role scope
  const coreWords = m.cargo.toLowerCase().split(' ').filter(w => w.length > 3);
  const goodOutside = m.treinamentos.filter(t => {
    const isOutside = !coreWords.some(w => t.nome.toLowerCase().includes(w));
    const isGood = ['Ótimo', 'Bom'].includes(t.conhecimento) || ['Ótimo', 'Bom'].includes(t.aplicacao);
    return isOutside && isGood;
  });
  if (goodOutside.length > 0) {
    const t = goodOutside[0]!;
    signals.push({
      tipo: 'Treinamento fora do escopo com bom desempenho',
      descricao: `"${t.nome}" avaliado com conhecimento "${t.conhecimento}" e aplicação "${t.aplicacao}" — área diferente do escopo principal do cargo.`,
      dado: t.nome,
    });
  }

  // Signal 3: High fit cultural + advanced prontidão
  const highFit = m.fit_cultural?.toLowerCase().includes('alto');
  const advancedProntidao = /agora|6 meses/i.test(m.nivel_prontidao);
  if (highFit && advancedProntidao) {
    signals.push({
      tipo: 'Prontidão e fit cultural altos',
      descricao: `Fit cultural "${parseShortLabel(m.fit_cultural)}" aliado ao nível de prontidão "${parseShortLabel(m.nivel_prontidao)}" indica capacidade de absorver novos desafios rapidamente.`,
      dado: parseShortLabel(m.nivel_prontidao),
    });
  }

  // Signal 4: Behavioral competencies suggest broader roles
  const leadershipKw = ['liderança', 'comunicação', 'influência', 'estratégia', 'equipe', 'gestão', 'visão'];
  const behav = [m.competencia_comportamental, m.competencia_comportamental_2].filter(Boolean).join(' ').toLowerCase();
  const leaderKw = leadershipKw.find(kw => behav.includes(kw));
  if (leaderKw) {
    const rawBehav = m.competencia_comportamental || m.competencia_comportamental_2 || leaderKw;
    signals.push({
      tipo: 'Competência comportamental de liderança',
      descricao: `"${rawBehav}" é frequentemente associada a perfis de gestão ou liderança técnica, além do escopo do cargo atual.`,
      dado: rawBehav,
    });
  }

  // Signal 5: Education in different area from current role
  if (m.curso_formacao && m.instituicao) {
    const cargoLower = m.cargo.toLowerCase();
    const formacaoLower = m.curso_formacao.toLowerCase();
    const sameArea = ['engenharia', 'análise', 'análise', 'gestão', 'sistemas', 'computação', 'tecnologia']
      .some(a => cargoLower.includes(a) && formacaoLower.includes(a));
    if (!sameArea) {
      signals.push({
        tipo: 'Formação acadêmica em área diferente',
        descricao: `Formação em ${m.curso_formacao} (${m.instituicao}) oferece perspectiva multidisciplinar que pode ser diferencial em funções que exigem visão mais ampla.`,
        dado: `${m.curso_formacao} — ${m.instituicao}`,
      });
    }
  }

  const hasTalent = signals.length >= 2;

  const potentialAreas: string[] = [];
  if (signals.some(s => s.tipo.includes('comportamental') || s.tipo.includes('liderança'))) potentialAreas.push('Liderança Técnica');
  if (signals.some(s => s.tipo.includes('treinamento'))) potentialAreas.push('Gestão de Projetos');
  if (signals.some(s => s.tipo.includes('formação'))) potentialAreas.push('Papéis Multidisciplinares');
  if (signals.some(s => s.tipo.includes('prontidão'))) potentialAreas.push('Expansão de Responsabilidades');
  if (potentialAreas.length === 0 && hasTalent) potentialAreas.push('Desafios além do cargo atual');

  const firstName = m.nome.split(' ')[0];
  const areas = potentialAreas.slice(0, 2).join(' ou ');
  const suggestion = hasTalent
    ? `${firstName} demonstra características compatíveis com papéis que vão além do cargo atual. ${signals[0]?.descricao || ''} Vale explorar uma conversa de desenvolvimento sobre ${areas}.`
    : '';

  return { hasTalent, signals, suggestion, potentialAreas };
};

// ─── Mock data (fallback when server is offline) ──────────────────────────────

const MOCK_MEMBERS: CareerMember[] = [
  {
    id: '1', nome: 'Jane Doe', cargo: 'Principal Product Designer', departamento: 'Design',
    nivel_cargo: 'Sênior', data_admissao: '2019-09-04', avatar: 'https://i.pravatar.cc/150?u=jane',
    nivel_escolaridade: 'Superior Completo', curso_formacao: 'Psicologia', instituicao: 'USP',
    idioma: 'Inglês', nivel_idioma: 'Avançado', anos_experiencia: 9,
    competencia_tecnica_1: 'Figma', competencia_tecnica_2: 'UX Research', competencia_tecnica_3: 'Dados',
    competencia_comportamental: 'Liderança Natural', competencia_comportamental_2: 'Comunicação',
    certificacoes: 'Google UX Certificate',
    fit_cultural: 'Alto - Vive e dissemina os valores', mapa_sucessao: 'Sim - Sucessora para Head de Design',
    nivel_prontidao: 'Pronta em 6 meses - Pequenas lacunas a desenvolver',
    risco_perda: 'Alto - Sinais claros de prospecção', impacto_saida: 'Crítico',
    designacao_sucessao: 'Não - Sem sucessor mapeado', potencial_crescimento: 'Alto',
    nota_desempenho: '5', comentarios_gestor: 'Excelente comunicação e liderança natural.',
    treinamentos: [
      { nome: 'Liderança Executiva', conhecimento: 'Ótimo', aplicacao: 'Ótimo', desempenho: 'Bom', eficacia: 'Sim', data: '2025-01-12', carga_horaria: '8h', provedor: 'Interno' },
      { nome: 'Estratégia de Produto', conhecimento: 'Bom', aplicacao: 'Bom', desempenho: 'Bom', eficacia: 'Sim', data: '2025-06-10', carga_horaria: '16h', provedor: 'Coursera' },
    ],
    competencias_exigidas: [
      { competencia: 'Figma', tipo: 'Técnica', nivel: 'Avançado' },
      { competencia: 'UX Research', tipo: 'Técnica', nivel: 'Avançado' },
      { competencia: 'Prototipagem', tipo: 'Técnica', nivel: 'Intermediário' },
      { competencia: 'Comunicação', tipo: 'Comportamental', nivel: 'Avançado' },
    ],
  },
  {
    id: '2', nome: 'Marcus Reed', cargo: 'Senior Engineering Lead', departamento: 'Engineering',
    nivel_cargo: 'Sênior', data_admissao: '2020-08-23', avatar: 'https://i.pravatar.cc/150?u=marcus',
    nivel_escolaridade: 'Pós-Graduação', curso_formacao: 'Ciência da Computação', instituicao: 'ITA',
    idioma: 'Inglês', nivel_idioma: 'Fluente', anos_experiencia: 12,
    competencia_tecnica_1: 'React', competencia_tecnica_2: 'Node.js', competencia_tecnica_3: 'Kubernetes',
    competencia_comportamental: 'Trabalho em Equipe', competencia_comportamental_2: 'Mentoria',
    certificacoes: 'AWS Solutions Architect',
    fit_cultural: 'Alto - Alinhado com os valores', mapa_sucessao: 'Sim - Sucessor para CTO',
    nivel_prontidao: 'Pronto Agora - Pode assumir novas responsabilidades',
    risco_perda: 'Médio', impacto_saida: 'Alto',
    designacao_sucessao: 'Sim', potencial_crescimento: 'Alto',
    nota_desempenho: '5', comentarios_gestor: 'Ótimo tecnicamente, referência no time.',
    treinamentos: [
      { nome: 'Arquitetura de Sistemas', conhecimento: 'Bom', aplicacao: 'Bom', desempenho: 'Bom', eficacia: 'Sim', data: '2026-05-18', carga_horaria: '40h', provedor: 'Interno' },
      { nome: 'Gestão de Pessoas', conhecimento: 'Ótimo', aplicacao: 'Ótimo', desempenho: 'Bom', eficacia: 'Sim', data: '2025-09-01', carga_horaria: '20h', provedor: 'LinkedIn Learning' },
    ],
    competencias_exigidas: [
      { competencia: 'React', tipo: 'Técnica', nivel: 'Avançado' },
      { competencia: 'Node.js', tipo: 'Técnica', nivel: 'Avançado' },
      { competencia: 'Arquitetura de Software', tipo: 'Técnica', nivel: 'Avançado' },
      { competencia: 'Liderança', tipo: 'Comportamental', nivel: 'Avançado' },
    ],
  },
  {
    id: '3', nome: 'Sarah Chen', cargo: 'Full Stack Architect', departamento: 'Engineering',
    nivel_cargo: 'Pleno', data_admissao: '2021-05-28', avatar: 'https://i.pravatar.cc/150?u=sarah',
    nivel_escolaridade: 'Superior Completo', curso_formacao: 'Marketing Digital', instituicao: 'ESPM',
    idioma: 'Inglês', nivel_idioma: 'Intermediário', anos_experiencia: 7,
    competencia_tecnica_1: 'Python', competencia_tecnica_2: 'SQL', competencia_tecnica_3: 'Análise de Dados',
    competencia_comportamental: 'Resolução de Problemas', competencia_comportamental_2: 'Proatividade',
    certificacoes: '',
    fit_cultural: 'Médio - Alinhado parcialmente', mapa_sucessao: 'Não mapeado',
    nivel_prontidao: 'Em Desenvolvimento - Necessita mais 1-2 anos',
    risco_perda: 'Baixo', impacto_saida: 'Médio',
    designacao_sucessao: 'Não', potencial_crescimento: 'Médio',
    nota_desempenho: '4', comentarios_gestor: 'Muito reservada, precisa de mais proatividade.',
    treinamentos: [
      { nome: 'Estratégia de Escala', conhecimento: 'Ruim', aplicacao: 'Ruim', desempenho: 'Ruim', eficacia: 'Não', data: '2026-02-08', carga_horaria: '40h', provedor: 'Coursera' },
      { nome: 'Fundamentos de Data Science', conhecimento: 'Ótimo', aplicacao: 'Bom', desempenho: 'Bom', eficacia: 'Sim', data: '2025-11-15', carga_horaria: '24h', provedor: 'Alura' },
    ],
    competencias_exigidas: [
      { competencia: 'JavaScript', tipo: 'Técnica', nivel: 'Avançado' },
      { competencia: 'Arquitetura de APIs', tipo: 'Técnica', nivel: 'Avançado' },
      { competencia: 'DevOps', tipo: 'Técnica', nivel: 'Intermediário' },
      { competencia: 'Resolução de Problemas', tipo: 'Comportamental', nivel: 'Avançado' },
    ],
  },
  {
    id: '4', nome: 'Thomas Klein', cargo: 'Operations Manager', departamento: 'Operations',
    nivel_cargo: 'Pleno', data_admissao: '2024-12-31', avatar: 'https://i.pravatar.cc/150?u=thomas',
    nivel_escolaridade: 'Superior Completo', curso_formacao: 'Administração', instituicao: 'FGV',
    idioma: 'Espanhol', nivel_idioma: 'Fluente', anos_experiencia: 5,
    competencia_tecnica_1: 'Excel Avançado', competencia_tecnica_2: 'Power BI', competencia_tecnica_3: '',
    competencia_comportamental: 'Gestão de Conflitos', competencia_comportamental_2: 'Organização',
    certificacoes: 'PMP',
    fit_cultural: 'Alto - Foco total em processos', mapa_sucessao: 'Não mapeado',
    nivel_prontidao: 'Pronto em 6 meses - Pequenas lacunas',
    risco_perda: 'Baixo', impacto_saida: 'Alto',
    designacao_sucessao: 'Não', potencial_crescimento: 'Baixo',
    nota_desempenho: '4', comentarios_gestor: 'Líder operacional eficiente.',
    treinamentos: [
      { nome: 'Gestão de Projetos', conhecimento: 'Ótimo', aplicacao: 'Bom', desempenho: 'Bom', eficacia: 'Sim', data: '2025-04-05', carga_horaria: '40h', provedor: 'Alura' },
      { nome: 'Liderança Estratégica', conhecimento: 'Bom', aplicacao: 'Ótimo', desempenho: 'Bom', eficacia: 'Sim', data: '2025-08-20', carga_horaria: '16h', provedor: 'Interno' },
    ],
    competencias_exigidas: [
      { competencia: 'Excel Avançado', tipo: 'Técnica', nivel: 'Avançado' },
      { competencia: 'Gestão de Processos', tipo: 'Técnica', nivel: 'Avançado' },
      { competencia: 'Gestão de Conflitos', tipo: 'Comportamental', nivel: 'Intermediário' },
    ],
  },
];

// ─── Prontidão badge colors ────────────────────────────────────────────────────

const DEPT_COLORS: Record<string, string> = {
  design: 'bg-purple-50 text-purple-700 border-purple-100',
  engineering: 'bg-blue-50 text-blue-700 border-blue-100',
  operations: 'bg-amber-50 text-amber-700 border-amber-100',
  marketing: 'bg-pink-50 text-pink-700 border-pink-100',
  financeiro: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

const deptColor = (dept: string) =>
  DEPT_COLORS[dept.toLowerCase()] || 'bg-gray-100 text-gray-600 border-gray-200';

// ─── Component ────────────────────────────────────────────────────────────────

const CareerMap: React.FC<{ managerId: string }> = ({ managerId }) => {
  const [members, setMembers] = useState<CareerMember[]>([]);
  const [filtered, setFiltered] = useState<CareerMember[]>([]);
  const [selected, setSelected] = useState<CareerMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [filterDept, setFilterDept] = useState('');
  const [filterProntidao, setFilterProntidao] = useState('');
  const [filterTalento, setFilterTalento] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`http://localhost:3001/api/career-map?managerId=${managerId}`);
        setMembers(res.data);
      } catch {
        setMembers(MOCK_MEMBERS);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [managerId]);

  useEffect(() => {
    let result = members;
    if (filterDept) result = result.filter(m => m.departamento.toLowerCase() === filterDept.toLowerCase());
    if (filterProntidao) result = result.filter(m => m.nivel_prontidao.toLowerCase().includes(filterProntidao.toLowerCase()));
    if (filterTalento) result = result.filter(m => computeHiddenTalent(m).hasTalent);
    setFiltered(result);
  }, [members, filterDept, filterProntidao, filterTalento]);

  const departments = [...new Set(members.map(m => m.departamento))].filter(Boolean);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <CareerDetailPanel member={selected} onClose={() => setSelected(null)} />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Mapa de Carreira</h1>
        <p className="text-gray-500 mt-2 text-sm font-medium">
          Visualize o potencial de desenvolvimento individual e identifique talentos ocultos no seu time.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 shadow-sm p-5 rounded-2xl flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
          <Filter className="w-3.5 h-3.5" />
          Filtros
        </div>
        <div className="w-px h-5 bg-gray-200" />

        {/* Department filter */}
        <select
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
          className="text-xs font-bold border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-600/10 focus:border-primary-600 transition-all"
        >
          <option value="">Todos os Departamentos</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {/* Prontidão filter */}
        <select
          value={filterProntidao}
          onChange={e => setFilterProntidao(e.target.value)}
          className="text-xs font-bold border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-600/10 focus:border-primary-600 transition-all"
        >
          <option value="">Qualquer Prontidão</option>
          <option value="agora">Pronto Agora</option>
          <option value="6 meses">Em 6 meses</option>
          <option value="1-2 anos">Em 1-2 anos</option>
          <option value="desenvolviment">Em Desenvolvimento</option>
        </select>

        {/* Talent alert toggle */}
        <button
          onClick={() => setFilterTalento(!filterTalento)}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-all ${
            filterTalento
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${filterTalento ? 'fill-amber-400 text-amber-400' : ''}`} />
          Talento Oculto Identificado
        </button>

        <span className="ml-auto text-xs text-gray-400 font-bold">
          {filtered.length} colaborador{filtered.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* Team Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded" />
              <div className="h-8 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-bold text-sm">Nenhum colaborador encontrado com os filtros aplicados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(m => {
            const prontidao = parseProntidao(m.nivel_prontidao);
            const talent = computeHiddenTalent(m);
            const fitLabel = parseShortLabel(m.fit_cultural);
            const potLabel = m.potencial_crescimento || '—';
            const initials = m.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

            return (
              <div
                key={m.id}
                className="bg-white border border-gray-100 shadow-md rounded-2xl p-6 flex flex-col gap-4 hover:shadow-lg transition-all duration-300 group"
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-primary-100 border border-primary-100 shrink-0 flex items-center justify-center">
                      <img
                        src={m.avatar}
                        alt={m.nome}
                        className="w-full h-full object-cover"
                        onError={e => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-primary-600 font-black text-sm">${initials}</span>`;
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-sm leading-snug">{m.nome}</h3>
                      <p className="text-gray-400 text-xs font-medium mt-0.5">{m.cargo}</p>
                    </div>
                  </div>
                  {talent.hasTalent && (
                    <div title="Talento Oculto Identificado pela IA" className="shrink-0">
                      <span className="flex items-center gap-1 text-[9px] font-black bg-amber-50 border border-amber-200 text-amber-600 px-2 py-1 rounded-full">
                        <Zap className="w-2.5 h-2.5 fill-amber-400" />
                        Talento
                      </span>
                    </div>
                  )}
                </div>

                {/* Department */}
                <span className={`self-start text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider ${deptColor(m.departamento)}`}>
                  {m.departamento}
                </span>

                {/* Key metrics */}
                <div className="space-y-2 border-t border-gray-50 pt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-bold">Prontidão</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${prontidao.bg} ${prontidao.border} ${prontidao.text}`}>
                      {prontidao.label}
                    </span>
                  </div>
                  {m.fit_cultural && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-bold">Fit Cultural</span>
                      <span className={`text-[10px] font-bold text-gray-600`}>{fitLabel}</span>
                    </div>
                  )}
                  {m.potencial_crescimento && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-bold">Potencial</span>
                      <span className={`text-[10px] font-bold ${potLabel === 'Alto' ? 'text-emerald-600' : potLabel === 'Baixo' ? 'text-rose-500' : 'text-amber-600'}`}>
                        {potLabel}
                      </span>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <button
                  onClick={() => setSelected(m)}
                  className="mt-auto flex items-center justify-between w-full px-4 py-2.5 bg-gray-50 hover:bg-primary-50 border border-gray-100 hover:border-primary-100 rounded-xl text-xs font-bold text-gray-600 hover:text-primary-600 transition-all active:scale-95"
                >
                  Ver Perfil de Carreira
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Insight banner */}
      {!isLoading && filtered.length > 0 && (
        <div className="bg-gradient-to-r from-gray-900 to-indigo-950 rounded-2xl p-6 flex items-center gap-5 shadow-lg">
          <div className="w-10 h-10 bg-purple-500/20 border border-purple-400/20 rounded-xl flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-white text-sm font-black">
              {filtered.filter(m => computeHiddenTalent(m).hasTalent).length} colaborador(es) com potencial não explorado identificado pela IA
            </p>
            <p className="text-gray-400 text-xs mt-0.5">
              Clique em "Ver Perfil de Carreira" para ver a análise detalhada com evidências e sugestões.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerMap;
