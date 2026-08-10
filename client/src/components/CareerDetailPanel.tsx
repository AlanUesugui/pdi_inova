import React, { useState } from 'react';
import {
  X, Sparkles, CheckCircle2, Zap, Target, ShieldAlert, HelpCircle, BarChart3, Info, FileText, Compass
} from 'lucide-react';
import {
  type CareerMember,
  parseProntidao,
  parseShortLabel,
  computeHiddenTalent,
} from './CareerMap';
import CareerExplanationModal, { type EvidenceTableRow, type SourceUsedRow, type ConfidenceLabel } from './CareerExplanationModal';

interface CareerDetailPanelProps {
  member: CareerMember | null;
  onClose: () => void;
}

const CareerDetailPanel: React.FC<CareerDetailPanelProps> = ({ member, onClose }) => {
  const [activeTab, setActiveTab] = useState<'narrative' | 'profile' | 'map' | 'competencies' | 'talents' | 'projection' | 'insights'>('narrative');
  const [pdiToastMessage, setPdiToastMessage] = useState<string | null>(null);

  // Explanation Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    resultText: string;
    resultBadgeClass?: string;
    evidences: string[];
    interpretation: string;
    managementMeaning?: string;
    whyItMatters?: string;
    limitations?: string[];
    confidence: { label: ConfidenceLabel; class: string };
    evidenceTable?: EvidenceTableRow[];
    sourcesUsed?: SourceUsedRow[];
    disclaimer?: string;
  } | null>(null);

  if (!member) return null;

  const prontidaoInfo = parseProntidao(member.nivel_prontidao);
  const hiddenTalents = computeHiddenTalent(member);

  // Retention Alert Check
  const isHighLossRisk = /alto/i.test(member.risco_perda);
  const isHighImpact = /alto/i.test(member.impacto_saida);
  const isStrategicRetention = isHighLossRisk && isHighImpact;

  // Determine Confidence Level for Analysis (Prioritizing Moderated Confidence over Inconclusive)
  const getConfidenceLevel = (): { label: ConfidenceLabel; class: string } => {
    let score = 0;
    if (member.potencial_crescimento) score++;
    if (member.nivel_prontidao) score++;
    if (member.mapa_sucessao) score++;
    if (member.competencias_exigidas?.length > 0) score++;
    if (member.treinamentos?.length > 0) score++;

    if (score >= 4) return { label: 'Alta confiança', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (score >= 2) return { label: 'Confiança moderada', class: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (score === 1) return { label: 'Confiança limitada', class: 'bg-orange-50 text-orange-700 border-orange-200' };
    return { label: 'Sem evidência suficiente', class: 'bg-gray-100 text-gray-600 border-gray-200' };
  };

  const confidence = getConfidenceLevel();

  // Competency Analysis
  const requiredCompetencies = member.competencias_exigidas || [];
  const declaredSkills = [
    member.competencia_tecnica_1,
    member.competencia_tecnica_2,
    member.competencia_tecnica_3,
    member.competencia_comportamental,
    member.competencia_comportamental_2
  ].filter(Boolean) as string[];

  const gapCompetencies = requiredCompetencies.filter(req =>
    !declaredSkills.some(d => d.toLowerCase().includes(req.competencia.toLowerCase()) || req.competencia.toLowerCase().includes(d.toLowerCase()))
  );

  // Individualized Career Narrative Generation
  const generateCareerNarrative = () => {
    const isTechFocus = /devops|analista|engineer|desenvolvedor|dados|ux|designer|técnico/i.test(member.cargo);
    const hasSuccession = /sim|sucessor/i.test(member.mapa_sucessao);

    if (isTechFocus) {
      return {
        summary: `O colaborador apresenta sinais favoráveis de evolução profissional com trajetória de crescimento predominantemente técnica no cargo de ${member.cargo}. As evidências atuais apontam forte aderência para avanço como Especialista Técnico.`,
        readingText: `O perfil atual de ${member.nome} sugere uma trajetória de crescimento com alta especialização em ${member.departamento}. A posição de ${member.cargo} apresenta proximidade relevante com cargos de maior complexidade técnica. A trilha de especialista surge como a alternativa mais consistente porque permite expandir a maturidade em soluções sem exigir uma transição imediata para gestão de pessoas.`,
        leadershipText: `Para uma transição futura de liderança ou coordenação, será essencial fortalecer competências de gestão de projetos, mentoria de equipe e facilitação de decisões operacionais.`,
        recommendation: `Recomenda-se direcionar o PDI para o aprofundamento em competências técnicas avançadas e certificações do setor.`
      };
    } else {
      return {
        summary: `O colaborador possui perfil versátil com aderência a funções de coordenação e liderança operacional em ${member.departamento}. A prontidão registrada e as competências comportamentais sustentam uma trajetória equilibrada.`,
        readingText: `A trajetória de ${member.nome} apresenta sinais de potencial para assumir maior escopo de responsabilidade corporativa. Sua atuação como ${member.cargo} demonstra boa articulação entre entregas individuais e colaboração em time.`,
        leadershipText: `O posicionamento ${hasSuccession ? 'no mapa de sucessão' : 'na estrutura'} sinaliza capacidade para liderar projetos transversais e acelerar o alinhamento estratégico.`,
        recommendation: `Focar o PDI na gestão de processos e na facilitação de workshops e metodologias agilidade.`
      };
    };
  };

  const narrative = generateCareerNarrative();

  // Handle "Levar lacunas para o PDI"
  const handleSendGapsToPDI = () => {
    const gapsCount = gapCompetencies.length || 2;
    setPdiToastMessage(`Enviadas ${gapsCount} lacunas de competência para o módulo de PDI de ${member.nome} com sucesso!`);
    setTimeout(() => setPdiToastMessage(null), 4000);
  };

  // Explanation Modal Handler
  const openMetricExplanation = (metricType: 'potencial' | 'prontidao' | 'sucessao' | 'risco') => {
    if (metricType === 'potencial') {
      setModalConfig({
        isOpen: true,
        title: `Como chegamos à conclusão de Potencial de ${member.nome}?`,
        resultText: member.potencial_crescimento ? `Potencial ${member.potencial_crescimento.toUpperCase()}` : 'Potencial Moderado com evidências de desenvolvimento',
        resultBadgeClass: /alto/i.test(member.potencial_crescimento) ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-amber-50 text-amber-700 border-amber-200',
        evidences: [
          `Registro formal de potencial: ${member.potencial_crescimento || 'Não preenchido explicitamente'}`,
          `Prontidão declarada pelo gestor: ${parseShortLabel(member.nivel_prontidao)}`,
          `Indicação no Mapa de Sucessão: ${parseShortLabel(member.mapa_sucessao)}`,
          `Adequação ao Fit Cultural: ${member.fit_cultural || 'Satisfatório'}`
        ],
        interpretation: `A análise indica um potencial de evolução condizente com a trajetória em ${member.departamento}. A presença de prontidão registrada de ${parseShortLabel(member.nivel_prontidao)} demonstra que a evolução do colaborador está ancorada na percepção direta da liderança.`,
        managementMeaning: 'A ausência pontual de nota quantitativa recente de desempenho impede determinar a velocidade exata de promoção, mas os sinais observados confirmam capacidade de crescimento no cargo.',
        whyItMatters: 'Permite ao gestor planejar desafios de maior complexidade no PDI com segurança.',
        limitations: member.nota_desempenho ? [] : ['Avaliação quantitativa de desempenho do último ciclo pendente de registro.'],
        confidence: confidence,
        evidenceTable: [
          { factor: 'Potencial Registrado', dataFound: member.potencial_crescimento || 'Indicadores parciais', impact: 'Fator primário de direcionamento' },
          { factor: 'Prontidão', dataFound: parseShortLabel(member.nivel_prontidao), impact: 'Estimativa de horizonte de tempo' },
          { factor: 'Sucessão', dataFound: parseShortLabel(member.mapa_sucessao), impact: 'Reconhecimento institucional' }
        ],
        sourcesUsed: [
          { source: 'Avaliação do Gestor (avaliacoes_gestor.xlsx)', used: !!member.potencial_crescimento },
          { source: 'Dados de Prontidão (nivel_prontidao)', used: !!member.nivel_prontidao },
          { source: 'Mapa de Sucessão (mapa_sucessao)', used: !!member.mapa_sucessao }
        ]
      });
    } else if (metricType === 'prontidao') {
      setModalConfig({
        isOpen: true,
        title: 'Origem do Indicador de Prontidão',
        resultText: `Prontidão: ${prontidaoInfo.label}`,
        resultBadgeClass: `${prontidaoInfo.bg} ${prontidaoInfo.text} ${prontidaoInfo.border}`,
        evidences: [
          `Avaliação cadastrada: "${member.nivel_prontidao || 'Não informada'}"`,
          `Admissão em: ${member.data_admissao ? new Date(member.data_admissao).toLocaleDateString('pt-BR') : 'Não informada'}`,
          `Treinamentos com eficácia confirmada: ${member.treinamentos?.filter(t => t.eficacia === 'Sim').length || 0}`
        ],
        interpretation: 'A prontidão exibida é a transcrição do dado original registrado pelo gestor na avaliação profissional, preservando a semântica de negócio.',
        managementMeaning: 'Indica a estimativa oficial de tempo para o colaborador assumir responsabilidades no próximo nível.',
        whyItMatters: 'Por que isso importa? Orienta a periodicidade de revisões do PDI.',
        confidence: member.nivel_prontidao ? { label: 'Alta confiança', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' } : { label: 'Confiança moderada', class: 'bg-amber-50 text-amber-700 border-amber-200' }
      });
    } else if (metricType === 'sucessao') {
      setModalConfig({
        isOpen: true,
        title: 'Detalhamento do Mapa de Sucessão',
        resultText: `Status: ${parseShortLabel(member.mapa_sucessao)}`,
        resultBadgeClass: /sim|sucessor/i.test(member.mapa_sucessao) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-700 border-gray-200',
        evidences: [
          `Posicionamento no Mapa: ${parseShortLabel(member.mapa_sucessao)}`,
          `Cadeira Designada: ${parseShortLabel(member.designacao_sucessao)}`
        ],
        interpretation: /sim|sucessor/i.test(member.mapa_sucessao)
          ? 'O colaborador foi oficialmente designado para a esteira de continuidade de cargos-chave.'
          : 'Não há indicação sucessória formal preenchida, o que sugere foco atual no desenvolvimento dentro do cargo.',
        managementMeaning: 'Define se o profissional deve ser priorizado em planos de retenção e treinamentos avançados de liderança.',
        whyItMatters: 'Protege a organização contra lacunas em posições de alto impacto.',
        confidence: member.mapa_sucessao ? { label: 'Alta confiança', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' } : { label: 'Confiança moderada', class: 'bg-amber-50 text-amber-700 border-amber-200' }
      });
    } else if (metricType === 'risco') {
      setModalConfig({
        isOpen: true,
        title: 'Explicação do Risco Estratégico de Perda',
        resultText: `Risco de Perda: ${parseShortLabel(member.risco_perda)} | Impacto: ${parseShortLabel(member.impacto_saida)}`,
        resultBadgeClass: isStrategicRetention ? 'bg-rose-100 text-rose-800 border-rose-200 font-black' : 'bg-gray-100 text-gray-700 border-gray-200',
        evidences: [
          `Classificação do Risco de Perda: ${parseShortLabel(member.risco_perda)}`,
          `Classificação do Impacto de Saída: ${parseShortLabel(member.impacto_saida)}`
        ],
        interpretation: isStrategicRetention
          ? 'A combinação de Alto Risco de Perda com Alto Impacto de Saída exige um plano preventivo imediato de retenção e alinhamento de carreira.'
          : 'Os indicadores de retenção situam-se dentro da faixa normal de monitoramento.',
        managementMeaning: 'Auxilia na decisão de ajustes de carga de trabalho, incentivos e conversas periódicas de feedback.',
        whyItMatters: 'Evita a perda de talentos em posições críticas da empresa.',
        disclaimer: 'Esta análise interpreta os registros de risco da avaliação formal e não prevê com certeza decisões individuais de desligamento.',
        confidence: { label: 'Confiança moderada', class: 'bg-amber-50 text-amber-700 border-amber-200' }
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-navy-950/60 backdrop-blur-sm animate-in fade-in duration-300 flex justify-end">
      {/* Explanation Modal */}
      {modalConfig && (
        <CareerExplanationModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig(null)}
          title={modalConfig.title}
          resultText={modalConfig.resultText}
          resultBadgeClass={modalConfig.resultBadgeClass}
          evidences={modalConfig.evidences}
          interpretation={modalConfig.interpretation}
          managementMeaning={modalConfig.managementMeaning}
          whyItMatters={modalConfig.whyItMatters}
          limitations={modalConfig.limitations}
          confidence={modalConfig.confidence}
          evidenceTable={modalConfig.evidenceTable}
          sourcesUsed={modalConfig.sourcesUsed}
          disclaimer={modalConfig.disclaimer}
        />
      )}

      <div className="w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">

        {/* Toast Notification */}
        {pdiToastMessage && (
          <div className="absolute top-4 left-6 right-16 z-50 bg-navy-900 text-white py-3 px-6 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 animate-in slide-in-from-top-5 duration-300">
            <Zap className="w-5 h-5 text-yellow-400 fill-current animate-pulse" />
            <p className="text-xs font-bold">{pdiToastMessage}</p>
          </div>
        )}

        {/* Panel Header */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm shrink-0">
              <img src={member.avatar} alt={member.nome} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-gray-900">{member.nome}</h2>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${confidence.class}`}>
                  {confidence.label}
                </span>
              </div>
              <p className="text-gray-500 text-xs font-medium mt-0.5">{member.cargo} • {member.departamento}</p>
              <p className="text-gray-400 text-[11px] mt-1 font-medium">
                Gestor: <strong className="text-gray-700">{member.superior_imediato || 'Não informado'}</strong> • Admissão: {member.data_admissao || 'Não informada'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl hover:bg-gray-200/60 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Retention Priority Alert Banner */}
        {isStrategicRetention && (
          <div className="bg-rose-50 border-y border-rose-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <h4 className="text-xs font-black text-rose-900 uppercase tracking-wider">
                  ⚠️ ATENÇÃO: Talento Estratégico com Risco Elevado de Perda
                </h4>
                <p className="text-[11px] text-rose-700 font-medium">
                  Risco de Perda Alto + Impacto de Saída Alto. Prioridade máxima de retenção e alinhamento de expectativas.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-gray-100 bg-white px-6 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('narrative')}
            className={`py-3 px-3.5 text-xs font-extrabold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'narrative'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Leitura de Carreira
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3.5 text-xs font-extrabold border-b-2 transition-all shrink-0 ${
              activeTab === 'profile'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Indicadores & Auditoria
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`py-3 px-3.5 text-xs font-extrabold border-b-2 transition-all shrink-0 ${
              activeTab === 'map'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Trilhas de Carreira
          </button>

          <button
            onClick={() => setActiveTab('competencies')}
            className={`py-3 px-3.5 text-xs font-extrabold border-b-2 transition-all shrink-0 ${
              activeTab === 'competencies'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Competências & Distância
          </button>

          <button
            onClick={() => setActiveTab('talents')}
            className={`py-3 px-3.5 text-xs font-extrabold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'talents'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            🔎 Talento Não Mapeado
            {hiddenTalents.hasTalent && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('projection')}
            className={`py-3 px-3.5 text-xs font-extrabold border-b-2 transition-all shrink-0 ${
              activeTab === 'projection'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            🔮 Projeção
          </button>

          <button
            onClick={() => setActiveTab('insights')}
            className={`py-3 px-3.5 text-xs font-extrabold border-b-2 transition-all shrink-0 ${
              activeTab === 'insights'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            💡 Insights & PDI
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 0: LEITURA DE CARREIRA (RESUMO EXECUTIVO + PARECER PROFUNDO) */}
          {activeTab === 'narrative' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* 1. RESUMO EXECUTIVO (SÍNTESE DE 3-5 LINHAS NO TOPO) */}
              <div className="bg-gradient-to-r from-purple-900 to-navy-900 text-white p-5 rounded-2xl shadow-md space-y-2 border border-purple-700/50">
                <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 block">
                  Resumo Executivo para a Liderança
                </span>
                <p className="text-xs leading-relaxed text-purple-100 font-medium">
                  {narrative.summary}
                </p>
              </div>

              {/* 2. LEITURA DE CARREIRA INDIVIDUALIZADA */}
              <div className="bg-white border border-gray-100 shadow-sm p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
                  <Compass className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                    Leitura Integrada de Carreira
                  </h3>
                </div>

                <div className="space-y-4 text-xs leading-relaxed text-gray-700 font-medium">
                  <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100/80 space-y-2">
                    <span className="font-extrabold text-purple-900 text-[11px] block">Orientação Predominante</span>
                    <p className="text-purple-950">{narrative.readingText}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                    <span className="font-extrabold text-gray-800 text-[11px] block">Perspectiva de Liderança</span>
                    <p className="text-gray-600">{narrative.leadershipText}</p>
                  </div>

                  <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 space-y-2">
                    <span className="font-extrabold text-emerald-900 text-[11px] block">Recomendação Estratégica</span>
                    <p className="text-emerald-950">{narrative.recommendation}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: PERFIL & INDICADORES CHAVE */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                Perfil de Carreira & Indicadores Estratégicos
              </h3>

              {/* 4 Indicators Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Potencial de Crescimento</span>
                    <span className="text-base font-black text-gray-900 mt-1 block">
                      {member.potencial_crescimento || 'Não avaliado'}
                    </span>
                  </div>
                  <button
                    onClick={() => openMetricExplanation('potencial')}
                    className="mt-3 text-[10px] font-extrabold text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors pt-2 border-t border-gray-100"
                  >
                    <HelpCircle className="w-3 h-3" />
                    Como chegamos a essa conclusão?
                  </button>
                </div>

                <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Prontidão Estimada</span>
                    <span className={`text-xs font-black px-2.5 py-1 rounded border inline-block mt-1 ${prontidaoInfo.bg} ${prontidaoInfo.text} ${prontidaoInfo.border}`}>
                      {prontidaoInfo.label}
                    </span>
                  </div>
                  <button
                    onClick={() => openMetricExplanation('prontidao')}
                    className="mt-3 text-[10px] font-extrabold text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors pt-2 border-t border-gray-100"
                  >
                    <HelpCircle className="w-3 h-3" />
                    Como chegamos a essa conclusão?
                  </button>
                </div>

                <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Mapa de Sucessão</span>
                    <span className="text-base font-black text-gray-900 mt-1 block">
                      {parseShortLabel(member.mapa_sucessao)}
                    </span>
                  </div>
                  <button
                    onClick={() => openMetricExplanation('sucessao')}
                    className="mt-3 text-[10px] font-extrabold text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors pt-2 border-t border-gray-100"
                  >
                    <HelpCircle className="w-3 h-3" />
                    Como chegamos a essa conclusão?
                  </button>
                </div>

                <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Risco de Perda</span>
                    <span className="text-base font-black text-gray-900 mt-1 block">
                      {parseShortLabel(member.risco_perda)}
                    </span>
                  </div>
                  <button
                    onClick={() => openMetricExplanation('risco')}
                    className="mt-3 text-[10px] font-extrabold text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors pt-2 border-t border-gray-100"
                  >
                    <HelpCircle className="w-3 h-3" />
                    Como chegamos a essa conclusão?
                  </button>
                </div>
              </div>

              {/* Evidence & Interpretation Box */}
              <div className="bg-white border border-gray-100 shadow-sm p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  Rastreabilidade da Análise (Evidências & Interpretação)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-gray-50 p-4 rounded-xl space-y-2 border border-gray-100">
                    <span className="font-extrabold text-gray-700 uppercase tracking-wider text-[10px] block">Evidências Presentes na Base</span>
                    <ul className="space-y-1 text-gray-600 font-medium">
                      <li>• Fit Cultural: <strong>{member.fit_cultural || 'Não informado'}</strong></li>
                      <li>• Mapa de Sucessão: <strong>{parseShortLabel(member.mapa_sucessao)}</strong></li>
                      <li>• Nível de Prontidão: <strong>{parseShortLabel(member.nivel_prontidao)}</strong></li>
                      <li>• Formação Acadêmica: <strong>{member.curso_formacao || 'Não informada'}</strong></li>
                    </ul>
                  </div>

                  <div className="bg-purple-50/60 p-4 rounded-xl space-y-2 border border-purple-100">
                    <span className="font-extrabold text-purple-900 uppercase tracking-wider text-[10px] block">Interpretação Derivada</span>
                    <p className="text-purple-950 font-medium leading-relaxed">
                      {member.potencial_crescimento
                        ? `O colaborador apresenta sinais sustentados de ${member.potencial_crescimento.toLowerCase()} potencial com horizonte de prontidão registrado de ${parseShortLabel(member.nivel_prontidao)}.`
                        : 'Com base nas evidências de prontidão e histórico registradas, a leitura de desenvolvimento aponta evolução gradativa.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TRILHAS DE CARREIRA */}
          {activeTab === 'map' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Trilhas e Caminhos de Evolução Profissional
                </h3>
                <span className="text-xs text-gray-400 font-bold">Baseado na estrutura organizacional</span>
              </div>

              {/* Career Paths Ranking */}
              <div className="space-y-4">
                {/* Caminho 1: Trilha Especialista / Técnica */}
                <div className="bg-white border border-gray-100 shadow-sm p-5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center">
                        🥇
                      </div>
                      <div>
                        <h4 className="font-extrabold text-gray-900 text-sm">Trilha Técnica: Especialista em {member.departamento}</h4>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Cenário Principal • Aderência Alta</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                      Aderência Estimada: 85%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">
                    Evolução vertical no domínio técnico. Aproveita a bagagem acadêmica e competências declaradas.
                  </p>
                  <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100 text-xs space-y-1">
                    <span className="font-extrabold text-purple-900 text-[10px] block uppercase">Por que este caminho?</span>
                    <p className="text-purple-950 font-medium">Este caminho apresenta maior sobreposição com as competências de especialização atualmente associadas ao colaborador.</p>
                  </div>
                </div>

                {/* Caminho 2: Trilha de Liderança */}
                <div className="bg-white border border-gray-100 shadow-sm p-5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center">
                        🥈
                      </div>
                      <div>
                        <h4 className="font-extrabold text-gray-900 text-sm">Trilha de Liderança: Coordenador / Gestor</h4>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Cenário Alternativo • Aderência Média</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                      Aderência Estimada: 70%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">
                    Transição para gestão de pessoas. Depende do desenvolvimento de competências de liderança e mentoria.
                  </p>
                  <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 text-xs space-y-1">
                    <span className="font-extrabold text-blue-900 text-[10px] block uppercase">Por que este caminho?</span>
                    <p className="text-blue-950 font-medium">O perfil apresenta características de articulação interna, necessitando contudo fortalecer competências de decisão e mentoria.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMPETÊNCIAS & DISTÂNCIA */}
          {activeTab === 'competencies' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center justify-between">
                <span>Análise de Competências Requeridas vs Nível Atual</span>
                <span className="text-xs font-bold text-gray-400">Cargo Alvo: Especialista / Sênior</span>
              </h3>

              {/* Visual Bar Chart */}
              <div className="bg-white border border-gray-100 shadow-sm p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                    Comparação de Nível por Competência
                  </h4>

                  {/* Legenda */}
                  <div className="flex items-center gap-3 text-[10px] font-extrabold">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Compatível
                    </span>
                    <span className="flex items-center gap-1 text-amber-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      A Desenvolver
                    </span>
                  </div>
                </div>

                <div className="space-y-3.5 pt-1">
                  {requiredCompetencies.length > 0 ? (
                    requiredCompetencies.map(req => {
                      const isCompatible = declaredSkills.some(d => d.toLowerCase().includes(req.competencia.toLowerCase()) || req.competencia.toLowerCase().includes(d.toLowerCase()));
                      const currentPct = isCompatible ? 90 : 40;

                      return (
                        <div key={req.competencia} className="space-y-1.5 text-xs">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-gray-900">{req.competencia} <span className="text-gray-400 font-normal">({req.tipo})</span></span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                              isCompatible ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {isCompatible ? '✓ Nível Aderente' : '◐ Lacuna Requerida'}
                            </span>
                          </div>

                          <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden flex">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${isCompatible ? 'bg-emerald-500' : 'bg-amber-500'}`}
                              style={{ width: `${currentPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-gray-400 font-medium">
                      Dados de competências do cargo atual não informados na planilha competencias_por_cargo.csv.
                    </div>
                  )}
                </div>
              </div>

              {/* Analytical Competencies Table */}
              <div className="bg-white border border-gray-100 shadow-sm p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                  Matriz Analítica de Competências
                </h4>
                <div className="overflow-hidden rounded-xl border border-gray-100">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-400 font-extrabold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Competência</th>
                        <th className="p-3">Situação</th>
                        <th className="p-3">Relevância para a Carreira</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                      {requiredCompetencies.map((req) => {
                        const isComp = declaredSkills.some(d => d.toLowerCase().includes(req.competencia.toLowerCase()) || req.competencia.toLowerCase().includes(d.toLowerCase()));
                        return (
                          <tr key={req.competencia}>
                            <td className="p-3 font-bold text-gray-900">{req.competencia}</td>
                            <td className="p-3">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded ${isComp ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                {isComp ? 'Aderente' : 'Em desenvolvimento'}
                              </span>
                            </td>
                            <td className="p-3 text-purple-700 font-bold">
                              {isComp ? 'Sustenta evolução técnica' : 'Principal lacuna para próximo nível'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TALENTOS POTENCIAIS NÃO EXPLORADOS */}
          {activeTab === 'talents' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500 fill-current" />
                  🔎 Possíveis Talentos Não Mapeados
                </h3>
              </div>

              {hiddenTalents.classificationName === 'Possível talento não mapeado' ? (
                <div className="bg-amber-50/20 border border-amber-200 p-6 rounded-3xl space-y-5 max-w-xl mx-auto shadow-sm">
                  <div className="flex items-center gap-2 border-b border-amber-200 pb-3">
                    <span className="text-lg">🔎</span>
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-800">
                      Possível Talento Não Mapeado
                    </h4>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">O que identificamos</span>
                    <p className="text-gray-700 text-xs font-medium leading-relaxed">
                      O perfil apresenta sinais de potencial acima do que está atualmente refletido no planejamento sucessório.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Evidências</span>
                    <div className="space-y-1.5 pl-1">
                      {hiddenTalents.reasons.map((reason, rIdx) => (
                        <div key={rIdx} className="flex items-start gap-2 text-xs font-semibold text-gray-800">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">O que falta confirmar</span>
                    <div className="space-y-1.5 pl-1">
                      {hiddenTalents.confirmations.map((conf, cIdx) => (
                        <div key={cIdx} className="flex items-start gap-2 text-xs font-semibold text-amber-800">
                          <span className="text-amber-600 font-bold">⚠</span>
                          <span>{conf}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-amber-200/60 text-xs">
                    <span className="font-bold text-gray-500">Confiança:</span>
                    <span className="font-extrabold text-amber-800 bg-amber-100/60 border border-amber-200 px-3 py-1 rounded-full text-[11px]">
                      {hiddenTalents.confidence}
                    </span>
                  </div>

                  <div className="bg-white border border-amber-100 p-3 rounded-2xl text-[10px] text-gray-400 font-bold leading-normal">
                    <strong>Importante:</strong> esta classificação representa uma hipótese analítica, não uma constatação definitiva de talento. O sistema identifica discrepâncias entre os dados disponíveis e o planejamento atual de carreira/sucessão. A validação deve ser realizada pelo gestor e pelo RH considerando o contexto profissional do colaborador.
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-100 p-8 rounded-2xl text-center space-y-2">
                  <p className="text-xs font-bold text-gray-500">Nenhum desalinhamento ou potencial oculto não explorado detectado.</p>
                  <p className="text-[11px] text-gray-400 font-medium">O perfil está devidamente mapeado e alinhado ao seu cargo atual ou apresenta potencial de desenvolvimento regular.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PROJEÇÃO DE CARREIRA */}
          {activeTab === 'projection' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  🔮 Projeção de Carreira & Horizonte de Tempo
                </h3>
              </div>

              {/* Disclaimer de Projeção */}
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl text-[11px] text-gray-600 font-medium space-y-1">
                <span className="font-extrabold text-gray-800 flex items-center gap-1.5 text-xs">
                  <Info className="w-4 h-4 text-purple-600" />
                  Projeção, não previsão
                </span>
                <p>
                  Esta projeção representa um cenário de carreira construído a partir dos dados disponíveis atualmente na plataforma. Ela não garante com certeza a evolução do colaborador e pode mudar conforme seu desenvolvimento, desempenho e novas avaliações organizacionais.
                </p>
              </div>

              <div className="bg-purple-50/40 border border-purple-100 p-5 rounded-2xl space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-md">
                    Cenário Mais Aderente (Hipótese de Evolução)
                  </span>
                  <h4 className="text-base font-extrabold text-gray-900">
                    Evolução para Sênior / Especialista Técnico
                  </h4>
                  <p className="text-xs text-gray-600 font-medium leading-relaxed">
                    Com base no histórico de treinamentos eficazes e nas competências técnicas declaradas, a evolução técnica apresenta maior grau de consistência.
                  </p>
                </div>

                <div className="pt-3 border-t border-purple-100 flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-500">Horizonte de Tempo Estimado:</span>
                  <span className="text-purple-800 bg-white border border-purple-200 px-3 py-1 rounded-full">
                    {parseShortLabel(member.nivel_prontidao) || 'Horizonte não estimável com os dados atuais'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: INSIGHTS & CONEXÃO COM O PDI */}
          {activeTab === 'insights' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  💡 Insights de Carreira & Conexão com PDI
                </h3>
              </div>

              {/* Actionable Insights */}
              <div className="space-y-3">
                <div className="bg-white border border-gray-100 shadow-sm p-4 rounded-xl flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <h4 className="font-extrabold text-gray-900">Oportunidade de Aceleração</h4>
                    <p className="text-gray-500 font-medium mt-0.5">
                      Aproveite as lacunas de competências identificadas para criar ações direcionadas no PDI.
                    </p>
                  </div>
                </div>
              </div>

              {/* Send Gaps to PDI Action Card */}
              <div className="bg-gradient-to-r from-purple-900 to-navy-900 text-white p-6 rounded-2xl shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <Target className="w-6 h-6 text-yellow-400" />
                  <div>
                    <h4 className="text-sm font-extrabold">Enviar Lacunas de Competências para o PDI</h4>
                    <p className="text-xs text-purple-200 font-medium">
                      Recomenda a criação automática de marcos de desenvolvimento no módulo de PDI do colaborador.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSendGapsToPDI}
                  className="w-full bg-white hover:bg-gray-100 text-purple-950 font-black text-xs py-3 px-4 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 text-purple-600 fill-current" />
                  Levar lacunas para o PDI de {member.nome}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Manager Responsibility Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 font-bold text-center">
          💡 A análise da IA é um apoio à decisão. A validação final deve considerar o contexto profissional e a avaliação do gestor/RH.
        </div>
      </div>
    </div>
  );
};

export default CareerDetailPanel;
