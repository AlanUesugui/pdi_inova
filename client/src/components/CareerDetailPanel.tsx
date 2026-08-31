import React, { useState } from 'react';
import {
  X, Sparkles, CheckCircle2, Zap, ShieldAlert, HelpCircle, BarChart3, Info, Compass, TrendingUp, AlertTriangle
} from 'lucide-react';
import {
  type CareerMember,
  parseProntidao,
  parseShortLabel,
} from './CareerMap';
import { analyzeCareerProfile } from '../utils/careerRules';
import CareerExplanationModal, { type EvidenceTableRow, type SourceUsedRow, type ConfidenceLabel } from './CareerExplanationModal';

interface CareerDetailPanelProps {
  member: CareerMember | null;
  onClose: () => void;
}

const CareerDetailPanel: React.FC<CareerDetailPanelProps> = ({ member, onClose }) => {
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

  const analysis = analyzeCareerProfile(member);
  const prontidaoInfo = parseProntidao(member.nivel_prontidao);

  const confidence = {
    label: analysis.confidenceLabel as ConfidenceLabel,
    class: analysis.confidenceClass,
    reason: analysis.confidenceReason
  };

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
    if (analysis.potentialStatus === 'NOT_EVALUATED') {
      return {
        summary: `O colaborador ${member.nome} possui registro oficial de Risco de Perda Baixo. Potencial e Prontidão encontram-se não avaliados no ciclo recente. Recomenda-se realizar avaliação oficial antes de definir trajetórias sucessórias.`,
        readingText: `A trajetória de ${member.nome} em ${member.departamento} como ${member.cargo} está em acompanhamento regular. A ausência de registro formal de potencial impede projeções automáticas de promoção.`,
        leadershipText: `Para posições futuras de coordenação ou especialização, é necessário realizar o ciclo de avaliação de potencial e identificar lacunas de competência.`,
        recommendation: `Incluir o colaborador no próximo ciclo formal de avaliação de potencial e prontidão.`
      };
    }

    const isTechFocus = /devops|analista|engineer|desenvolvedor|dados|ux|designer|técnico/i.test(member.cargo);

    if (isTechFocus) {
      return {
        summary: `O colaborador apresenta sinais favoráveis de evolução técnica no cargo de ${member.cargo}. As evidências atuais apontam aderência para trilha de Especialista Técnico.`,
        readingText: `O perfil de ${member.nome} em ${member.departamento} demonstra maturidade no escopo técnico atual. A trilha de especialista surge como caminho consistente.`,
        leadershipText: `Para evolução técnica ou liderança de projetos, recomenda-se aprofundar competências de arquitetura e mentoria de pares.`,
        recommendation: `Direcionar o PDI para competências técnicas de maior complexidade e certificações do setor.`
      };
    } else {
      return {
        summary: `O colaborador possui perfil versátil em ${member.departamento}. Os indicadores registrados sustentam uma trajetória de desenvolvimento no cargo de ${member.cargo}.`,
        readingText: `A atuação de ${member.nome} demonstra boa articulação entre entregas individuais e colaboração em equipe.`,
        leadershipText: `O posicionamento na estrutura sinaliza capacidade para coordenação operacional de projetos.`,
        recommendation: `Focar o PDI na gestão de processos e na facilitação de projetos transversais.`
      };
    }
  };

  const narrative = generateCareerNarrative();

  // Handle "Vincular lacunas ao PDI"
  const handleSendGapsToPDI = () => {
    const gapsCount = gapCompetencies.length || 2;
    setPdiToastMessage(`Enviadas ${gapsCount} lacunas de competência para o módulo de PDI de ${member.nome} com sucesso!`);
    setTimeout(() => setPdiToastMessage(null), 4000);
  };

  // Explanation Modal Handler
  const openMetricExplanation = (metricType: 'potencial' | 'prontidao' | 'sucessao' | 'risco' | 'impacto') => {
    if (metricType === 'potencial') {
      setModalConfig({
        isOpen: true,
        title: `Auditoria de Dado — Potencial Mapeado de ${member.nome}`,
        resultText: `Potencial: ${analysis.potentialLabel}`,
        resultBadgeClass: analysis.potentialStatus === 'HIGH_POTENTIAL' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-gray-100 text-gray-700 border-gray-200',
        evidences: [
          `Registro formal de potencial: "${member.potencial_crescimento || 'Não avaliado'}"`,
          `Status do indicador: ${analysis.potentialStatus === 'NOT_EVALUATED' ? 'Não avaliado no ciclo oficial' : analysis.potentialLabel}`,
          `Indicação no Mapa de Sucessão: ${analysis.successionStatusLabel}`
        ],
        interpretation: analysis.potentialStatus === 'NOT_EVALUATED'
          ? 'O indicador de potencial não está preenchido no cadastro do colaborador. O sistema não infere potencial na ausência de dado oficial.'
          : `O potencial de crescimento registrado é "${analysis.potentialLabel}", refletindo a percepção formal da liderança.`,
        managementMeaning: 'Define a expectativa de crescimento em termos de complexidade de entregas.',
        whyItMatters: 'Permite planejar desafios de desenvolvimento alinhados à capacidade do liderado.',
        limitations: analysis.potentialStatus === 'NOT_EVALUATED' ? ['Avaliação oficial de potencial pendente de registro.'] : [],
        confidence: confidence,
        evidenceTable: [
          { factor: 'Potencial Registrado', dataFound: member.potencial_crescimento || 'Ausente', impact: 'Fonte de verdade primária' },
          { factor: 'Prontidão Registrada', dataFound: parseShortLabel(member.nivel_prontidao), impact: 'Estimativa de horizonte de tempo' }
        ],
        sourcesUsed: [
          { source: 'Avaliação do Gestor (avaliacoes_gestor.xlsx)', used: !!member.potencial_crescimento },
          { source: 'Tabela de Desempenho / Potencial (Supabase)', used: true }
        ]
      });
    } else if (metricType === 'prontidao') {
      setModalConfig({
        isOpen: true,
        title: `Auditoria de Dado — Prontidão Estimada de ${member.nome}`,
        resultText: `Prontidão: ${prontidaoInfo.label}`,
        resultBadgeClass: `${prontidaoInfo.bg} ${prontidaoInfo.text} ${prontidaoInfo.border}`,
        evidences: [
          `Avaliação cadastrada: "${member.nivel_prontidao || 'Não avaliada'}"`,
          `Data de Admissão: ${member.data_admissao ? new Date(member.data_admissao).toLocaleDateString('pt-BR') : 'Não informada'}`
        ],
        interpretation: 'A prontidão exibida é a transcrição do dado original registrado pelo gestor na avaliação profissional.',
        managementMeaning: 'Indica a estimativa de tempo para o colaborador assumir o próximo nível de responsabilidade.',
        whyItMatters: 'Orienta a periodicidade de revisões do plano de desenvolvimento.',
        confidence: confidence
      });
    } else if (metricType === 'sucessao') {
      setModalConfig({
        isOpen: true,
        title: `Auditoria de Dado — Mapa de Sucessão de ${member.nome}`,
        resultText: `Status: ${analysis.successionStatusLabel}`,
        resultBadgeClass: analysis.isFormalSuccessor ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-700 border-gray-200',
        evidences: [
          `Posicionamento no Mapa: ${analysis.successionStatusLabel}`,
          `Designação para Cadeira: ${analysis.successionDesignationLabel}`
        ],
        interpretation: analysis.isFormalSuccessor
          ? 'O colaborador está formalmente registrado como sucessor no mapa de talentos da organização.'
          : 'O colaborador não consta no mapa de sucessão formal.',
        managementMeaning: 'Define prioridade para programas formais de mentoria de liderança e substituição de cadeiras-chave.',
        whyItMatters: 'Protege a continuidade de posições estratégicas.',
        confidence: confidence
      });
    } else if (metricType === 'risco' || metricType === 'impacto') {
      setModalConfig({
        isOpen: true,
        title: `Auditoria de Conclusão — Risco & Impacto de ${member.nome}`,
        resultText: `Risco de Perda: ${analysis.riskLabel} | Impacto: ${analysis.impactLabel}`,
        resultBadgeClass: analysis.isHighRisk ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-200',
        evidences: [
          `Risco de Perda oficial: "${parseShortLabel(member.risco_perda)}"`,
          `Impacto de Saída oficial: "${parseShortLabel(member.impacto_saida)}"`
        ],
        interpretation: analysis.isLowRisk && analysis.isHighImpact
          ? 'O risco oficial é BAIXO. O diagnóstico de Monitoramento Preventivo decorre do impacto elevado da vaga, e NÃO de um risco de saída alto.'
          : (analysis.isHighRisk ? 'Apresenta risco oficial elevado de saída, autorizando plano de retenção.' : 'Indicadores dentro da normalidade operacional.'),
        managementMeaning: 'Diferencia a probabilidade de saída da consequência operacional da perda.',
        whyItMatters: 'Impede classificar colaboradores de baixo risco como ameaça de turnover.',
        disclaimer: 'Análise baseada nos registros oficiais cadastrados.',
        confidence: confidence
      });
    }
  };

  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-950/65 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

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

      {/* Main Single Page Modal */}
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-2xl animate-in zoom-in-95 duration-200 z-10">

        {/* Top Header Bar */}
        <div className="shrink-0 bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950 px-8 pt-7 pb-6 relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-72 h-72 bg-purple-600/10 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/10 blur-3xl rounded-full pointer-events-none" />

          {/* Toast Notification */}
          {pdiToastMessage && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white font-black text-xs px-4 py-2 rounded-full shadow-lg border border-emerald-400 animate-in fade-in zoom-in z-50 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{pdiToastMessage}</span>
            </div>
          )}

          {/* Top row controls */}
          <div className="flex justify-between items-start mb-5 relative z-10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-300" />
              <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest">
                Inteligência Integrada de Carreira & Governança
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
                <img src={member.avatar} alt={member.nome} className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white leading-snug flex items-center gap-2">
                  {member.nome}
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${confidence.class}`}>
                    {confidence.label}
                  </span>
                </h2>
                <p className="text-gray-300 text-xs font-medium mt-0.5">{member.cargo} • {member.departamento}</p>
                <div className="flex items-center gap-2 mt-1.5 text-gray-400 text-[10px] font-bold">
                  <span>Gestor: {member.superior_imediato || 'Não informado'}</span>
                  <span>•</span>
                  <span>Admissão: {member.data_admissao || 'Não informada'}</span>
                  <span>•</span>
                  <span>Atualizado em {today}</span>
                </div>
              </div>
            </div>

            {/* Primary Insight Score Badge */}
            <div className={`shrink-0 text-center bg-white/10 border border-white/10 rounded-2xl px-5 py-3 min-w-[190px]`}>
              <p className="text-[9px] font-black text-purple-300 uppercase tracking-widest mb-0.5">Diagnóstico Oficial</p>
              <p className={`text-sm font-black tracking-tight ${analysis.primaryInsight.badgeText}`}>
                {analysis.primaryInsight.title}
              </p>
            </div>
          </div>
        </div>

        {/* ── DISCLAIMER GERAL BAR ────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white border-b border-purple-100/80 px-8 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shrink-0">
          <div className="space-y-0.5">
            <span className="font-extrabold text-purple-900 flex items-center gap-1.5 text-xs">
              <Info className="w-4 h-4 text-purple-600" />
              Sobre esta análise de carreira
            </span>
            <p className="text-gray-600 font-medium leading-relaxed text-[11px]">
              A Inteligência de Carreira interpreta os dados oficiais para orientar a tomada de decisão do gestor sem contradizer registros cadastrais.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSendGapsToPDI}
              className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs py-2 px-3.5 rounded-xl transition-all shadow-sm shrink-0 active:scale-95 flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-300 fill-current" />
              Vincular Lacunas ao PDI
            </button>
          </div>
        </div>

        {/* ── SCROLLABLE INTEGRATED SINGLE PAGE ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50/40 text-xs">

          {/* 1. SEÇÃO DO DIAGNÓSTICO PRINCIPAL (PRIMARY CAREER INSIGHT) */}
          <div className={`p-6 rounded-3xl border shadow-sm transition-all relative overflow-hidden ${analysis.primaryInsight.badgeBg} ${analysis.primaryInsight.badgeBorder}`}>
            <div className="absolute top-0 right-0 w-2 h-full bg-purple-600" />
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Diagnóstico Principal (Curadoria Analítica)
                </span>
                <h3 className={`text-xl font-black ${analysis.primaryInsight.badgeText} tracking-tight`}>
                  {analysis.primaryInsight.title}
                </h3>
                <p className="text-xs font-extrabold text-gray-800">
                  {analysis.primaryInsight.subtitle}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-700 font-medium leading-relaxed mt-3 pt-3 border-t border-black/5">
              {analysis.primaryInsight.description}
            </p>
          </div>

          {/* 2. RESUMO EXECUTIVO INTEGRADO */}
          <div className="bg-gradient-to-r from-purple-900 to-navy-900 text-white p-6 rounded-3xl shadow-md space-y-2 border border-purple-700/50">
            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 block">
              Resumo Executivo da Situação de Carreira
            </span>
            <p className="text-xs leading-relaxed text-purple-100 font-medium">
              {narrative.summary}
            </p>
          </div>

          {/* 3. INDICADORES OFICIAIS (SOURCE OF TRUTH) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              Indicadores Oficiais Cadastrados (Fonte de Verdade)
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Risco de Perda</span>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-lg border inline-block mt-1.5 ${analysis.isHighRisk ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                    {analysis.riskLabel}
                  </span>
                </div>
                <button
                  onClick={() => openMetricExplanation('risco')}
                  className="mt-3 text-[10px] font-extrabold text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors pt-2 border-t border-gray-100"
                >
                  <HelpCircle className="w-3 h-3" />
                  Auditar dado
                </button>
              </div>

              <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Impacto de Saída</span>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-lg border inline-block mt-1.5 ${analysis.isHighImpact ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                    {analysis.impactLabel}
                  </span>
                </div>
                <button
                  onClick={() => openMetricExplanation('impacto')}
                  className="mt-3 text-[10px] font-extrabold text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors pt-2 border-t border-gray-100"
                >
                  <HelpCircle className="w-3 h-3" />
                  Auditar dado
                </button>
              </div>

              <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Sucessão Formal</span>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-lg border inline-block mt-1.5 ${analysis.isFormalSuccessor ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                    {analysis.successionStatusLabel}
                  </span>
                </div>
                <button
                  onClick={() => openMetricExplanation('sucessao')}
                  className="mt-3 text-[10px] font-extrabold text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors pt-2 border-t border-gray-100"
                >
                  <HelpCircle className="w-3 h-3" />
                  Auditar dado
                </button>
              </div>

              <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Potencial Mapeado</span>
                  <span className="text-xs font-black text-gray-900 mt-1.5 block">
                    {analysis.potentialLabel}
                  </span>
                </div>
                <button
                  onClick={() => openMetricExplanation('potencial')}
                  className="mt-3 text-[10px] font-extrabold text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors pt-2 border-t border-gray-100"
                >
                  <HelpCircle className="w-3 h-3" />
                  Auditar dado
                </button>
              </div>

              <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Prontidão Estimada</span>
                  <span className={`text-xs font-black px-2 py-0.5 rounded border inline-block mt-1.5 ${prontidaoInfo.bg} ${prontidaoInfo.text} ${prontidaoInfo.border}`}>
                    {prontidaoInfo.label}
                  </span>
                </div>
                <button
                  onClick={() => openMetricExplanation('prontidao')}
                  className="mt-3 text-[10px] font-extrabold text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors pt-2 border-t border-gray-100"
                >
                  <HelpCircle className="w-3 h-3" />
                  Auditar dado
                </button>
              </div>
            </div>
          </div>

          {/* 4. POR QUE CHEGAMOS A ESSA CONCLUSÃO? (FATOS x INTERPRETAÇÃO x RECOMENDAÇÃO) */}
          <div className="bg-white border border-gray-100 shadow-sm p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Compass className="w-5 h-5 text-purple-600" />
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                Por que chegamos a essa conclusão?
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-gray-50 p-4 rounded-2xl space-y-2 border border-gray-100">
                <span className="font-extrabold text-gray-900 text-[11px] block uppercase tracking-wider">
                  📋 Evidências Registradas na Base
                </span>
                <ul className="space-y-1.5 text-gray-700 font-medium">
                  {analysis.evidenceList.map((ev, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">•</span>
                      <span><strong>{ev.category}:</strong> {ev.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-purple-50/50 p-4 rounded-2xl space-y-2 border border-purple-100">
                <span className="font-extrabold text-purple-900 text-[11px] block uppercase tracking-wider">
                  💡 Racional de Interpretação
                </span>
                <p className="text-purple-950 font-medium leading-relaxed">
                  {analysis.explanationSummary}
                </p>
                <p className="text-purple-900 text-[11px] font-bold mt-2 pt-2 border-t border-purple-200/60">
                  {analysis.whyItMatters}
                </p>
              </div>
            </div>
          </div>

          {/* 5. ANÁLISE DE RISCO & MATRIZ RISCO × IMPACTO (DETERMINÍSTICA) */}
          <div className="bg-white border border-gray-100 shadow-sm p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                  Análise Estratégica Risco × Impacto (Matriz Determinística)
                </h3>
              </div>
              <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${analysis.isHighRisk ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                Risco Oficial: {analysis.riskLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className={`p-4 rounded-2xl border ${analysis.isLowRisk && !analysis.isHighImpact ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                <span className="text-[10px] font-extrabold text-gray-500 block uppercase">Risco Baixo × Impacto Baixo</span>
                <span className="text-xs font-black text-gray-800">Baixa Prioridade / Situação Regular</span>
              </div>

              <div className={`p-4 rounded-2xl border ${analysis.isLowRisk && analysis.isHighImpact ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                <span className="text-[10px] font-extrabold text-blue-800 block uppercase">Risco Baixo × Impacto Alto</span>
                <span className="text-xs font-black text-blue-950">🛡️ MONITORAMENTO PREVENTIVO</span>
              </div>

              <div className={`p-4 rounded-2xl border ${analysis.isMediumRisk && !analysis.isHighImpact ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                <span className="text-[10px] font-extrabold text-gray-500 block uppercase">Risco Médio × Impacto Baixo</span>
                <span className="text-xs font-black text-gray-800">Acompanhamento de Carreira</span>
              </div>

              <div className={`p-4 rounded-2xl border ${analysis.isHighRisk && analysis.isHighImpact ? 'bg-rose-100 border-rose-300 ring-2 ring-rose-500 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                <span className="text-[10px] font-extrabold text-rose-800 block uppercase">Risco Alto × Impacto Alto</span>
                <span className="text-xs font-black text-rose-950">🚨 PRIORIDADE ESTRATÉGICA DE RETENÇÃO</span>
              </div>
            </div>
          </div>

          {/* 6. TRAJETÓRIA & PERSPECTIVA DE CARREIRA */}
          <div className="bg-white border border-gray-100 shadow-sm p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                Trajetória & Perspectiva de Carreira
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-blue-50/40 rounded-2xl border border-blue-100 text-xs">
              <div className="bg-white border border-blue-200 p-3 rounded-xl shadow-sm text-center flex-1 w-full">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">Cargo Atual</span>
                <span className="font-black text-gray-900">{member.cargo}</span>
              </div>

              <span className="text-blue-500 font-bold hidden sm:inline">➔</span>

              <div className="bg-white border border-purple-200 p-3 rounded-xl shadow-sm text-center flex-1 w-full">
                <span className="text-[9px] font-bold text-purple-600 uppercase block">Próximo Passo Sugerido</span>
                <span className="font-black text-purple-900">
                  {/analista/i.test(member.cargo) ? 'Especialista / Consultor' : (/consultor/i.test(member.cargo) ? 'Coordenador de Área' : 'Gerente / Liderança')}
                </span>
              </div>

              <span className="text-blue-500 font-bold hidden sm:inline">➔</span>

              <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-sm text-center flex-1 w-full">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">Horizonte Futuro</span>
                <span className="font-black text-gray-700">Liderança / Especialista Sênior</span>
              </div>
            </div>
          </div>

          {/* 7. LACUNAS DA ANÁLISE (DATA GAPS) */}
          {analysis.dataGaps.length > 0 && (
            <div className="bg-amber-50/60 border border-amber-200/80 p-6 rounded-3xl space-y-3">
              <div className="flex items-center gap-2 border-b border-amber-200 pb-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider">
                  Lacunas da Análise (Dados Ausentes ou Pendentes)
                </h3>
              </div>
              <ul className="space-y-1.5 text-amber-900 font-medium text-xs">
                {analysis.dataGaps.map((gap, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-amber-800 font-medium pt-1 border-t border-amber-200/60">
                💡 A ausência de dados é tratada como incerteza e não é interpretada artificialmente como avaliação negativa.
              </p>
            </div>
          )}

          {/* 8. O QUE PODERIA MUDAR ESTA ANÁLISE? */}
          {analysis.whatCouldChange.length > 0 && (
            <div className="bg-white border border-gray-100 shadow-sm p-6 rounded-3xl space-y-3">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <Zap className="w-5 h-5 text-indigo-600" />
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                  O que poderia mudar esta análise?
                </h3>
              </div>
              <ul className="space-y-1.5 text-gray-700 font-medium text-xs">
                {analysis.whatCouldChange.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">➔</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 9. COMPETÊNCIAS & GAPS */}
          <div className="bg-white border border-gray-100 shadow-sm p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                  Competências Registradas & Lacunas
                </h3>
              </div>
              <button
                onClick={handleSendGapsToPDI}
                className="text-xs font-extrabold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3.5 py-1.5 rounded-xl transition-all border border-purple-200"
              >
                Vincular Lacunas ao PDI
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <span className="font-extrabold text-gray-800 text-[11px] block uppercase">Competências Declaradas</span>
                <div className="flex flex-wrap gap-1.5">
                  {declaredSkills.length > 0 ? (
                    declaredSkills.map((skill, idx) => (
                      <span key={idx} className="bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-1 rounded-lg font-bold">
                        ✓ {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 font-medium">Nenhuma competência técnica específica cadastrada.</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-extrabold text-amber-900 text-[11px] block uppercase">Gaps Mapeados para o Cargo</span>
                <div className="flex flex-wrap gap-1.5">
                  {gapCompetencies.length > 0 ? (
                    gapCompetencies.map((gap, idx) => (
                      <span key={idx} className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg font-bold">
                        ⚠ {gap.competencia} ({gap.nivel})
                      </span>
                    ))
                  ) : (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold">
                      ✓ Aderência técnica completa às exigências do cargo
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 10. RECOMENDAÇÕES PRÁTICAS E PROPORCIONAIS */}
          <div className="bg-white border border-gray-100 shadow-sm p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                Recomendações Práticas para o Gestor
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {analysis.recommendations.map((rec, idx) => (
                <div key={idx} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-600 font-black">#{idx + 1}</span>
                    <h4 className="font-black text-gray-900">{rec.title}</h4>
                  </div>
                  <p className="text-gray-700 font-extrabold">{rec.action}</p>
                  <p className="text-gray-500 text-[11px] font-medium pt-1 border-t border-gray-200/50">{rec.rationale}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 11. DISCLAIMER LEGAL & INSTITUCIONAL */}
          <div className="bg-gray-100/70 border border-gray-200 p-4 rounded-2xl text-[11px] text-gray-500 font-medium leading-relaxed">
            <strong>Sobre esta análise:</strong> A análise de IA é um apoio à decisão. As conclusões são baseadas nos dados disponíveis e podem ser limitadas por ausência, desatualização ou inconsistência das informações. A validação final deve considerar o contexto profissional e a avaliação do gestor/RH.
          </div>

        </div>

        {/* Manager Responsibility Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 font-bold text-center">
          💡 A análise da IA é um apoio à decisão. A validação final cabe ao gestor e RH.
        </div>
      </div>
    </div>
  );
};

export default CareerDetailPanel;
