export interface CareerMemberRawData {
  id: string;
  nome: string;
  cargo: string;
  departamento: string;
  gestor_id?: string;
  superior_imediato?: string;
  data_admissao?: string;
  status?: string;
  modalidade_trabalho?: string;
  email?: string;
  nivel_cargo?: string;
  centro_de_custo?: string;
  tipo_contrato?: string;
  fit_cultural?: string;
  mapa_sucessao?: string;
  nivel_prontidao?: string;
  risco_perda?: string;
  impacto_saida?: string;
  designacao_sucessao?: string;
  potencial_crescimento?: string;
  nota_desempenho?: string;
  comentarios_gestor?: string;
  treinamentos?: Array<{
    nome: string;
    conhecimento?: string;
    aplicacao?: string;
    desempenho?: string;
    eficacia?: string;
    data?: string;
    carga_horaria?: string;
    provedor?: string;
  }>;
  competencias_exigidas?: Array<{
    competencia: string;
    tipo?: string;
    nivel?: string;
  }>;
  feedbacks?: Array<{
    tipo: string;
    conteudo: string;
    data: string;
  }>;
  evaluationsHistory?: Array<{
    data: string;
    desempenho?: string;
    potencial?: string;
    risco?: string;
  }>;
}

export type OfficialRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'NOT_EVALUATED';
export type OfficialImpact = 'LOW' | 'MEDIUM' | 'HIGH' | 'NOT_EVALUATED';
export type OfficialSuccession = 'FORMAL_SUCCESSOR' | 'NOT_MAPPED' | 'NOT_EVALUATED';
export type OfficialPotential = 'HIGH' | 'MEDIUM' | 'LOW' | 'NOT_EVALUATED';
export type OfficialReadiness = 'READY_NOW' | 'READY_SHORT_TERM' | 'READY_MEDIUM_TERM' | 'DEVELOPMENT_NEEDED' | 'NOT_IN_MAP' | 'NOT_EVALUATED';

export type ConfidenceLevel = 'HIGH_CONFIDENCE' | 'MEDIUM_CONFIDENCE' | 'LOW_CONFIDENCE' | 'INSUFFICIENT_DATA';

export type PrimaryInsightCode = 
  | 'STRATEGIC_RETENTION_PRIORITY'
  | 'RETENTION_ATTENTION'
  | 'STRATEGIC_ATTENTION'
  | 'PREVENTIVE_MONITORING'
  | 'CAREER_ACCOMPANIMENT'
  | 'FORMAL_SUCCESSOR'
  | 'POTENTIAL_SUCCESSOR'
  | 'RECOGNIZED_TALENT'
  | 'UNMAPPED_TALENT'
  | 'POTENTIAL_DEVELOPMENT'
  | 'TECHNICAL_SPECIALIZATION'
  | 'REGULAR_PROFILE'
  | 'INSUFFICIENT_DATA'
  | 'DATA_CONFLICT';

export interface PrimaryInsight {
  code: PrimaryInsightCode;
  title: string;
  subtitle: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconName: 'ShieldAlert' | 'ShieldCheck' | 'Sparkles' | 'Zap' | 'TrendingUp' | 'Target' | 'Compass' | 'HelpCircle';
}

export interface RecommendationItem {
  type: 'RETENTION' | 'DEVELOPMENT' | 'LEADERSHIP' | 'CAREER_TALK' | 'SPECIALIZATION' | 'EVALUATION';
  title: string;
  action: string;
  rationale: string;
}

export interface EvidenceChainLink {
  data: string;
  dataInterpretation: string;
  relationToOtherData: string;
  conclusion: string;
  careerImplication: string;
}

export interface SuccessionDeepDive {
  isSuccessor: boolean;
  isFormal: boolean;
  tierLabel: string;
  targetRole: string;
  whyMappedOrNot: string;
  supportingIndicators: string[];
  readinessHorizon: string;
  gapsToAddress: string[];
  confidenceAndNextSteps: string;
}

export interface CuratedCareerAssessment {
  collaborator: {
    id: string;
    nome: string;
    cargo: string;
    departamento: string;
    superior_imediato: string;
    data_admissao: string;
  };
  officialIndicators: {
    risk: { value: OfficialRisk; label: string; raw: string; source: string; date?: string };
    impact: { value: OfficialImpact; label: string; raw: string; source: string; date?: string };
    succession: { value: OfficialSuccession; label: string; raw: string; source: string; date?: string };
    potential: { value: OfficialPotential; label: string; raw: string; source: string; date?: string };
    readiness: { value: OfficialReadiness; label: string; raw: string; source: string; date?: string };
  };
  matrixAssessment: {
    code: string;
    label: string;
    explanation: string;
  };
  successionTier: {
    code: 'FORMAL_SUCCESSOR' | 'POTENTIAL_SUCCESSOR' | 'POSSIBLE_POTENTIAL' | 'NON_CONCLUSIVE';
    label: string;
    evidenceLevel: 'EVIDÊNCIA FORTE' | 'EVIDÊNCIA MODERADA' | 'EVIDÊNCIA FRACA' | 'INSUFFICIENT';
    explanation: string;
  };
  hiddenTalentTier: {
    code: 'UNMAPPED_TALENT' | 'RECOGNIZED_TALENT' | 'POTENTIAL_DEVELOPMENT' | 'STANDARD_PROFILE';
    label: string;
    isRare: boolean;
    explanation: string;
  };
  evidenceScore: number;
  confidence: {
    level: ConfidenceLevel;
    label: string;
    badgeClass: string;
    reason: string;
  };
  dataFreshness: {
    isFresh: boolean;
    lastEvaluationDate: string;
    freshnessLabel: string;
  };
  primaryInsight: PrimaryInsight;
  facts: Array<{ label: string; value: string; source: string }>;
  evidenceList: Array<{ category: string; text: string; level: 'NÍVEL 1 — DADO OFICIAL' | 'NÍVEL 2 — DADO DERIVADO' | 'NÍVEL 3 — INFERÊNCIA' }>;
  conflicts: string[];
  dataGaps: string[];
  whatCouldChange: string[];
  whyThisConclusion: {
    factsSummary: string;
    interpretation: string;
    recommendationSummary: string;
  };
  recommendations: RecommendationItem[];
  careerPaths: Array<{
    stage: string;
    title: string;
    type: 'CAMINHO POSSÍVEL' | 'CAMINHO RECOMENDADO' | 'SUCESSÃO FORMAL';
    description: string;
  }>;
  disclaimer: string;

  // ─── NOVO REQUISITO: EXPLICAÇÃO PROFUNDA E AUDITÁVEL (3 CAMADAS) ──────────
  deepExplanation: {
    whyThisClassification: string;
    whatItMeans: string;
    whatItDoesNotMean: string;
    chainOfEvidence: EvidenceChainLink[];
    successionDeepDive: SuccessionDeepDive;
    potentialDeepDive: {
      statusLabel: string;
      meaning: string;
      whatItDoesNotMean: string;
    };
    riskImpactDeepDive: {
      riskLabel: string;
      impactLabel: string;
      separationExplanation: string;
    };
    hiddenTalentDeepDive: {
      statusLabel: string;
      explanation: string;
    };
    gapAnalysisDeep: {
      identifiedGaps: string[];
      impactOnCurrentRole: string;
      impactOnFutureRole: string;
    };
    trajectoryAnalysis: {
      pastToPresent: string;
      presentToFuture: string;
    };
    executiveSummary3Layers: {
      layer1Executive: string;
      layer2Analytical: string;
      layer3Auditable: string;
    };
  };
}

// ─── UTILITIES & PARSERS ───────────────────────────────────────────────────

export const parseShortLabel = (raw?: string): string => {
  if (!raw || raw.trim() === '') return 'Não avaliado';
  return raw.split(' - ')[0]?.trim() || raw.trim();
};

export const parseOfficialRisk = (raw?: string): { value: OfficialRisk; label: string } => {
  if (!raw || raw.trim() === '') return { value: 'NOT_EVALUATED', label: 'Não avaliado' };
  const short = parseShortLabel(raw);
  if (/^alto/i.test(short)) return { value: 'HIGH', label: 'Alto' };
  if (/^médio|^medio/i.test(short)) return { value: 'MEDIUM', label: 'Médio' };
  if (/^baixo/i.test(short)) return { value: 'LOW', label: 'Baixo' };
  return { value: 'NOT_EVALUATED', label: short };
};

export const parseOfficialImpact = (raw?: string): { value: OfficialImpact; label: string } => {
  if (!raw || raw.trim() === '') return { value: 'NOT_EVALUATED', label: 'Não avaliado' };
  const short = parseShortLabel(raw);
  if (/^crítico|^critico|^alto/i.test(short)) return { value: 'HIGH', label: 'Alto / Crítico' };
  if (/^médio|^medio/i.test(short)) return { value: 'MEDIUM', label: 'Médio' };
  if (/^baixo/i.test(short)) return { value: 'LOW', label: 'Baixo' };
  return { value: 'NOT_EVALUATED', label: short };
};

export const parseOfficialSuccession = (raw?: string): { value: OfficialSuccession; label: string } => {
  if (!raw || raw.trim() === '') return { value: 'NOT_EVALUATED', label: 'Não avaliado' };
  if (/não está no mapa|nao esta no mapa/i.test(raw)) return { value: 'NOT_MAPPED', label: 'Não está no mapa de sucessão' };
  const short = parseShortLabel(raw);
  if (/^sim|^sucessor/i.test(short)) return { value: 'FORMAL_SUCCESSOR', label: 'Sucessor formal' };
  if (/^não|^nao/i.test(short)) return { value: 'NOT_MAPPED', label: 'Não está no mapa' };
  return { value: 'NOT_EVALUATED', label: short };
};

export const parseOfficialPotential = (raw?: string): { value: OfficialPotential; label: string } => {
  if (!raw || raw.trim() === '') return { value: 'NOT_EVALUATED', label: 'Não avaliado' };
  const short = parseShortLabel(raw);
  if (/^alto/i.test(short)) return { value: 'HIGH', label: 'Alto' };
  if (/^médio|^medio/i.test(short)) return { value: 'MEDIUM', label: 'Médio' };
  if (/^baixo/i.test(short)) return { value: 'LOW', label: 'Baixo' };
  return { value: 'NOT_EVALUATED', label: short };
};

export const parseOfficialReadiness = (raw?: string): { value: OfficialReadiness; label: string } => {
  if (!raw || raw.trim() === '') return { value: 'NOT_EVALUATED', label: 'Não avaliada' };
  if (/não está no mapa|nao esta no mapa/i.test(raw)) return { value: 'NOT_IN_MAP', label: 'Não está no mapa de sucessão' };
  const short = parseShortLabel(raw);
  if (/agora|imediata/i.test(short)) return { value: 'READY_NOW', label: 'Pronto agora' };
  if (/6 meses/i.test(short)) return { value: 'READY_SHORT_TERM', label: 'Pronto em 6 meses' };
  if (/1.?2 anos|12 meses/i.test(short)) return { value: 'READY_MEDIUM_TERM', label: 'Pronto em 1 a 2 anos' };
  if (/desenvolviment/i.test(short)) return { value: 'DEVELOPMENT_NEEDED', label: 'Em desenvolvimento' };
  return { value: 'NOT_EVALUATED', label: short };
};

// ─── CORE ANALYTICAL ENGINE ───────────────────────────────────────────────

export const buildCuratedAssessment = (m: CareerMemberRawData): CuratedCareerAssessment => {
  const risk = parseOfficialRisk(m.risco_perda);
  const impact = parseOfficialImpact(m.impacto_saida);
  const succession = parseOfficialSuccession(m.mapa_sucessao);
  const potential = parseOfficialPotential(m.potencial_crescimento);
  const readiness = parseOfficialReadiness(m.nivel_prontidao);

  const facts: Array<{ label: string; value: string; source: string }> = [
    { label: 'Cargo Atual', value: m.cargo || 'Não informado', source: 'Cadastro do Colaborador' },
    { label: 'Departamento', value: m.departamento || 'Não informado', source: 'Estrutura Organizacional' },
    { label: 'Gestor Direto', value: m.superior_imediato || 'Não informado', source: 'Tabela de Gestores' },
    { label: 'Risco de Perda', value: risk.label, source: 'Avaliação Oficial do Gestor (Campo 04)' },
    { label: 'Impacto de Saída', value: impact.label, source: 'Avaliação Oficial do Gestor (Campo 05)' },
    { label: 'Mapa de Sucessão', value: succession.label, source: 'Avaliação Oficial do Gestor (Campo 02)' },
    { label: 'Potencial Mapeado', value: potential.label, source: 'Avaliação Oficial do Gestor' },
    { label: 'Prontidão Registrada', value: readiness.label, source: 'Avaliação Oficial do Gestor (Campo 03)' },
  ];

  // Coleta de Evidências por Nível
  const evidenceList: Array<{ category: string; text: string; level: 'NÍVEL 1 — DADO OFICIAL' | 'NÍVEL 2 — DADO DERIVADO' | 'NÍVEL 3 — INFERÊNCIA' }> = [];

  // Level 1 Evidence (Fatos Oficiais)
  if (m.risco_perda) evidenceList.push({ category: 'Risco de Perda', text: `Dado oficial registrado: "${risk.label}"`, level: 'NÍVEL 1 — DADO OFICIAL' });
  if (m.impacto_saida) evidenceList.push({ category: 'Impacto de Saída', text: `Dado oficial registrado: "${impact.label}"`, level: 'NÍVEL 1 — DADO OFICIAL' });
  if (m.mapa_sucessao) evidenceList.push({ category: 'Mapa de Sucessão', text: `Dado oficial registrado: "${succession.label}"`, level: 'NÍVEL 1 — DADO OFICIAL' });
  if (m.potencial_crescimento) evidenceList.push({ category: 'Potencial', text: `Dado oficial registrado: "${potential.label}"`, level: 'NÍVEL 1 — DADO OFICIAL' });
  if (m.nivel_prontidao) evidenceList.push({ category: 'Prontidão', text: `Dado oficial registrado: "${readiness.label}"`, level: 'NÍVEL 1 — DADO OFICIAL' });

  // Level 2 Evidence (Dados Derivados)
  const perfNum = parseFloat(m.nota_desempenho || '');
  const isHighPerformance = !isNaN(perfNum) && perfNum >= 4.0;
  if (isHighPerformance) {
    evidenceList.push({ category: 'Desempenho', text: `Nota de desempenho consistente de ${perfNum} no ciclo recente`, level: 'NÍVEL 2 — DADO DERIVADO' });
  }

  const effectiveTrainings = (m.treinamentos || []).filter(t => t.eficacia && t.eficacia.toLowerCase() === 'sim');
  if (effectiveTrainings.length > 0) {
    evidenceList.push({ category: 'Treinamentos PDI', text: `${effectiveTrainings.length} treinamentos com aplicação prática eficaz confirmada`, level: 'NÍVEL 2 — DADO DERIVADO' });
  }

  const isManagerFavorable = !!m.comentarios_gestor && /excelente|destaque|promissor|supera|evolução|crescimento|ótimo|liderança/i.test(m.comentarios_gestor);
  if (isManagerFavorable) {
    evidenceList.push({ category: 'Comentário do Gestor', text: `Avaliação qualitativa do gestor favorável: "${m.comentarios_gestor && m.comentarios_gestor.length > 60 ? m.comentarios_gestor.substring(0, 60) + '...' : m.comentarios_gestor}"`, level: 'NÍVEL 2 — DADO DERIVADO' });
  }

  // Identificação de Conflitos e Divergências de Registro
  const conflicts: string[] = [];
  if (m.designacao_sucessao && /^sim/i.test(parseShortLabel(m.designacao_sucessao)) && succession.value === 'NOT_MAPPED') {
    conflicts.push('Divergência registrada: O Mapa de Sucessão oficial indica "Não está no mapa", enquanto a designação indica "Sim". Adotado o posicionamento conservador oficial.');
  }

  // Identificação de Lacunas da Análise (Data Gaps)
  const dataGaps: string[] = [];
  if (potential.value === 'NOT_EVALUATED') dataGaps.push('Potencial ainda não avaliado no ciclo oficial.');
  if (readiness.value === 'NOT_EVALUATED' || readiness.value === 'NOT_IN_MAP') dataGaps.push('Prontidão sucessória ainda não avaliada ou colaborador fora do mapa.');
  if (!m.nota_desempenho) dataGaps.push('Nota quantitativa de desempenho ausente no registro recente.');
  if (!m.treinamentos || m.treinamentos.length === 0) dataGaps.push('Nenhum treinamento com avaliação de eficácia registrado no ciclo.');

  // Freshness
  const lastDate = m.evaluationsHistory?.[0]?.data || '2026-01-01';
  const dataFreshness = {
    isFresh: true,
    lastEvaluationDate: lastDate,
    freshnessLabel: `Avaliação registrada referente a ${lastDate}`
  };

  // Score de Evidências (Quality & Completeness)
  let evidenceScore = 0;
  if (risk.value !== 'NOT_EVALUATED') evidenceScore++;
  if (impact.value !== 'NOT_EVALUATED') evidenceScore++;
  if (succession.value !== 'NOT_EVALUATED') evidenceScore++;
  if (potential.value !== 'NOT_EVALUATED') evidenceScore++;
  if (readiness.value !== 'NOT_EVALUATED' && readiness.value !== 'NOT_IN_MAP') evidenceScore++;
  if (effectiveTrainings.length > 0) evidenceScore++;
  if (isHighPerformance) evidenceScore++;
  if (isManagerFavorable) evidenceScore++;

  let confidenceLevel: ConfidenceLevel = 'INSUFFICIENT_DATA';
  let confidenceLabel = 'Dados insuficientes';
  let confidenceBadgeClass = 'bg-gray-100 text-gray-600 border-gray-200';
  let confidenceReason = 'Escassez de indicadores oficiais cadastrados na base.';

  if (evidenceScore >= 5) {
    confidenceLevel = 'HIGH_CONFIDENCE';
    confidenceLabel = 'Alta confiança';
    confidenceBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    confidenceReason = 'Alta confiança ancorada em múltiplos indicadores oficiais (avaliação do gestor, risco, impacto e histórico de PDI).';
  } else if (evidenceScore >= 3) {
    confidenceLevel = 'MEDIUM_CONFIDENCE';
    confidenceLabel = 'Confiança moderada';
    confidenceBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
    confidenceReason = 'Confiança moderada baseada nos registros existentes de risco/impacto, porém com lacunas em potencial ou prontidão.';
  } else if (evidenceScore >= 1) {
    confidenceLevel = 'LOW_CONFIDENCE';
    confidenceLabel = 'Confiança limitada';
    confidenceBadgeClass = 'bg-orange-50 text-orange-700 border-orange-200';
    confidenceReason = 'Confiança limitada devido à ausência de avaliações estruturadas completas no ciclo recente.';
  }

  // ─── MATRIZ RISCO × IMPACTO (DETERMINÍSTICA E INDEPENDENTE) ───────────────
  let matrixCode = 'REGULAR';
  let matrixLabel = 'Baixa Prioridade';
  let matrixExplanation = 'Risco e impacto situam-se em patamares regulares de acompanhamento.';

  if (risk.value === 'HIGH' && impact.value === 'HIGH') {
    matrixCode = 'HIGH_HIGH';
    matrixLabel = 'Prioridade Estratégica de Retenção';
    matrixExplanation = 'Risco elevado de perda combinado com alto impacto organizacional em caso de saída.';
  } else if (risk.value === 'HIGH' && impact.value !== 'HIGH') {
    matrixCode = 'HIGH_LOW';
    matrixLabel = 'Atenção à Retenção';
    matrixExplanation = 'Risco elevado de saída com impacto operacional moderado ou baixo.';
  } else if (risk.value === 'MEDIUM' && impact.value === 'HIGH') {
    matrixCode = 'MEDIUM_HIGH';
    matrixLabel = 'Atenção Estratégica';
    matrixExplanation = 'Risco moderado de saída com alto impacto potencial em caso de vacância da posição.';
  } else if (risk.value === 'MEDIUM' && impact.value !== 'HIGH') {
    matrixCode = 'MEDIUM_LOW';
    matrixLabel = 'Acompanhamento de Carreira';
    matrixExplanation = 'Risco moderado de saída com impacto contido nas atividades da equipe.';
  } else if (risk.value === 'LOW' && impact.value === 'HIGH') {
    matrixCode = 'LOW_HIGH';
    matrixLabel = 'Monitoramento Preventivo';
    matrixExplanation = 'Risco de perda atualmente baixo, porém com impacto elevado em caso de desligamento. Exige acompanhamento preventivo sem alarme de retenção.';
  } else if (risk.value === 'LOW') {
    matrixCode = 'LOW_LOW';
    matrixLabel = 'Baixa Prioridade / Regular';
    matrixExplanation = 'Risco de saída baixo e impacto operacional gerenciável.';
  }

  // ─── SUCESSÃO (NÍVEIS DE EVIDÊNCIA) ──────────────────────────────────────
  let successionTierCode: 'FORMAL_SUCCESSOR' | 'POTENTIAL_SUCCESSOR' | 'POSSIBLE_POTENTIAL' | 'NON_CONCLUSIVE' = 'NON_CONCLUSIVE';
  let successionTierLabel = 'Não Conclusivo';
  let evidenceLevel: 'EVIDÊNCIA FORTE' | 'EVIDÊNCIA MODERADA' | 'EVIDÊNCIA FRACA' | 'INSUFFICIENT' = 'INSUFFICIENT';
  let successionExplanation = 'Dados insuficientes para concluir sobre posicionamento sucessório.';

  if (succession.value === 'FORMAL_SUCCESSOR') {
    successionTierCode = 'FORMAL_SUCCESSOR';
    successionTierLabel = 'Sucessor Formal';
    evidenceLevel = 'EVIDÊNCIA FORTE';
    successionExplanation = 'Mapeado oficialmente na matriz de sucessão da organização.';
  } else if (potential.value === 'HIGH' && (readiness.value === 'READY_NOW' || readiness.value === 'READY_SHORT_TERM') && evidenceScore >= 4) {
    successionTierCode = 'POTENTIAL_SUCCESSOR';
    successionTierLabel = 'Potencial Sucessório';
    evidenceLevel = 'EVIDÊNCIA MODERADA';
    successionExplanation = 'Apresenta evidências consistentes de desempenho e prontidão em curto prazo, porém ainda não consta no mapa formal.';
  } else if (potential.value === 'HIGH' || potential.value === 'MEDIUM') {
    successionTierCode = 'POSSIBLE_POTENTIAL';
    successionTierLabel = 'Possível Potencial';
    evidenceLevel = 'EVIDÊNCIA FRACA';
    successionExplanation = 'Existem sinais de potencial, porém as evidências atuais são limitadas para indicação sucessória.';
  } else if (succession.value === 'NOT_MAPPED') {
    successionTierCode = 'NON_CONCLUSIVE';
    successionTierLabel = 'Não Mapeado / Não Conclusivo';
    evidenceLevel = 'INSUFFICIENT';
    successionExplanation = 'O colaborador não está formalmente inserido no mapa de sucessão e os dados não sustentam indicação automática.';
  }

  // ─── TALENTO OCULTO (RARO E CONSERVADOR) ─────────────────────────────────
  let hiddenTalentCode: 'UNMAPPED_TALENT' | 'RECOGNIZED_TALENT' | 'POTENTIAL_DEVELOPMENT' | 'STANDARD_PROFILE' = 'STANDARD_PROFILE';
  let hiddenTalentLabel = 'Perfil Padrão';
  let isRare = false;
  let hiddenTalentExplanation = 'Perfil alinhado ao acompanhamento regular de desenvolvimento no cargo atual.';

  if (succession.value !== 'FORMAL_SUCCESSOR' && potential.value === 'HIGH' && evidenceScore >= 5 && effectiveTrainings.length >= 2) {
    hiddenTalentCode = 'UNMAPPED_TALENT';
    hiddenTalentLabel = 'Possível Talento Não Mapeado';
    isRare = true;
    hiddenTalentExplanation = 'Identificada discrepância relevante entre o alto nível de entrega/capacidade demonstrado e a ausência de mapeamento sucessório formal.';
  } else if (potential.value === 'HIGH') {
    hiddenTalentCode = 'RECOGNIZED_TALENT';
    hiddenTalentLabel = 'Talento Reconhecido';
    hiddenTalentExplanation = 'Colaborador com alto potencial reconhecido na estrutura atual.';
  } else if (potential.value === 'MEDIUM' || isHighPerformance) {
    hiddenTalentCode = 'POTENTIAL_DEVELOPMENT';
    hiddenTalentLabel = 'Potencial de Desenvolvimento';
    hiddenTalentExplanation = 'Trajetória em evolução constante com oportunidade de ampliação de competências.';
  }

  // ─── DIAGNÓSTICO PRINCIPAL (PRIMARY CAREER INSIGHT) E VALIDAÇÕES DE BLOQUEIO ──
  let primaryInsight: PrimaryInsight;

  if (conflicts.length > 0) {
    primaryInsight = {
      code: 'DATA_CONFLICT',
      title: 'INCONSISTÊNCIA DE DADOS IDENTIFICADA',
      subtitle: 'Divergência entre registros de sucessão ou retenção',
      description: conflicts[0] || 'Identificada inconsistência nos registros. Análise mantida em postura conservadora baseada na fonte oficial.',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      badgeBorder: 'border-amber-200',
      iconName: 'ShieldAlert'
    };
  } else if (risk.value === 'HIGH') {
    // APENAS RISCO ALTO AUTORIZA RETENÇÃO
    primaryInsight = {
      code: impact.value === 'HIGH' ? 'STRATEGIC_RETENTION_PRIORITY' : 'RETENTION_ATTENTION',
      title: impact.value === 'HIGH' ? 'PRIORIDADE ESTRATÉGICA DE RETENÇÃO' : 'ATENÇÃO À RETENÇÃO',
      subtitle: 'Risco elevado de perda registrado na avaliação formal',
      description: succession.value === 'FORMAL_SUCCESSOR'
        ? 'O colaborador é sucessor formal mapeado e apresenta risco elevado de saída. Exige plano de retenção imediato.'
        : 'O colaborador apresenta risco elevado de saída registrado na base oficial de retenção.',
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-700',
      badgeBorder: 'border-rose-200',
      iconName: 'ShieldAlert'
    };
  } else if (risk.value === 'LOW' && impact.value === 'HIGH') {
    primaryInsight = {
      code: 'PREVENTIVE_MONITORING',
      title: 'MONITORAMENTO PREVENTIVO',
      subtitle: 'Risco de perda baixo com impacto elevado em caso de saída',
      description: 'O risco de saída registrado é baixo. A recomendação de acompanhamento decorre do alto impacto potencial da vaga, sem classificar o profissional como risco elevado.',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-700',
      badgeBorder: 'border-blue-200',
      iconName: 'ShieldCheck'
    };
  } else if (succession.value === 'FORMAL_SUCCESSOR') {
    primaryInsight = {
      code: 'FORMAL_SUCCESSOR',
      title: 'SUCESSOR MAPEADO',
      subtitle: 'Inserido formalmente no plano de sucessão da organização',
      description: `Colaborador formalmente registrado no mapa de sucessão (${readiness.label}). Situação regular de retenção.`,
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      badgeBorder: 'border-emerald-200',
      iconName: 'ShieldCheck'
    };
  } else if (hiddenTalentCode === 'UNMAPPED_TALENT') {
    primaryInsight = {
      code: 'UNMAPPED_TALENT',
      title: 'POSSÍVEL TALENTO NÃO MAPEADO',
      subtitle: 'Evidências de capacidade superiores sem mapeamento formal',
      description: 'Identificada combinação de alto potencial com múltiplas evidências objetivas de desempenho sem constar no mapa sucessório.',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      badgeBorder: 'border-amber-200',
      iconName: 'Zap'
    };
  } else if (potential.value === 'HIGH') {
    primaryInsight = {
      code: 'RECOGNIZED_TALENT',
      title: 'TALENTO RECONHECIDO',
      subtitle: 'Perfil de alto potencial registrado em desenvolvimento',
      description: 'Reconhecido pelo seu alto potencial de crescimento e contribuição para a área.',
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-700',
      badgeBorder: 'border-purple-200',
      iconName: 'Sparkles'
    };
  } else if (potential.value === 'MEDIUM' || isHighPerformance) {
    primaryInsight = {
      code: 'POTENTIAL_DEVELOPMENT',
      title: 'POTENCIAL DE DESENVOLVIMENTO',
      subtitle: 'Trajetória em evolução constante no cargo atual',
      description: 'Apresenta perspectiva favorável para consolidação técnica e expansão gradual de responsabilidades.',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-700',
      badgeBorder: 'border-blue-200',
      iconName: 'TrendingUp'
    };
  } else if (evidenceScore <= 1) {
    primaryInsight = {
      code: 'INSUFFICIENT_DATA',
      title: 'ACOMPANHAMENTO DE CARREIRA (DADOS INCOMPLETOS)',
      subtitle: 'Informações insuficientes para diagnósticos preditivos avançados',
      description: 'O colaborador não possui avaliações completas de potencial ou prontidão na base. Recomenda-se realizar ciclo de avaliação.',
      badgeBg: 'bg-gray-100',
      badgeText: 'text-gray-700',
      badgeBorder: 'border-gray-200',
      iconName: 'HelpCircle'
    };
  } else {
    primaryInsight = {
      code: 'REGULAR_PROFILE',
      title: 'PERFIL SEM ALERTA CRÍTICO',
      subtitle: 'Acompanhamento regular de carreira e metas de desenvolvimento',
      description: 'O colaborador não apresenta alertas críticos de retenção. O desenvolvimento deve focar as metas regulares do PDI.',
      badgeBg: 'bg-gray-100',
      badgeText: 'text-gray-700',
      badgeBorder: 'border-gray-200',
      iconName: 'Compass'
    };
  }

  // ─── VALIDATION GUARDS (MANDATORY BLOCKERS) ───────────────────────────────
  // GUARD 1: IF officialRisk == LOW -> BLOCK RETENTION_PRIORITY & HIGH RISK CLAIMS
  if (risk.value === 'LOW') {
    if (primaryInsight.code === 'STRATEGIC_RETENTION_PRIORITY' || primaryInsight.code === 'RETENTION_ATTENTION') {
      primaryInsight = impact.value === 'HIGH' ? {
        code: 'PREVENTIVE_MONITORING',
        title: 'MONITORAMENTO PREVENTIVO',
        subtitle: 'Risco de perda baixo com impacto elevado em caso de saída',
        description: 'O risco de saída registrado é baixo. A recomendação de acompanhamento decorre do alto impacto potencial da vaga, sem classificar o profissional como risco elevado.',
        badgeBg: 'bg-blue-50',
        badgeText: 'text-blue-700',
        badgeBorder: 'border-blue-200',
        iconName: 'ShieldCheck'
      } : {
        code: 'REGULAR_PROFILE',
        title: 'PERFIL SEM ALERTA CRÍTICO',
        subtitle: 'Acompanhamento regular de carreira e metas de desenvolvimento',
        description: 'O colaborador apresenta risco de perda baixo registrado na base oficial.',
        badgeBg: 'bg-gray-100',
        badgeText: 'text-gray-700',
        badgeBorder: 'border-gray-200',
        iconName: 'Compass'
      };
    }
  }

  // GUARD 2: IF potential == NOT_EVALUATED -> CANNOT BE HIGH_POTENTIAL
  if (potential.value === 'NOT_EVALUATED') {
    if (primaryInsight.code === 'RECOGNIZED_TALENT' || primaryInsight.code === 'UNMAPPED_TALENT') {
      primaryInsight = {
        code: 'CAREER_ACCOMPANIMENT',
        title: 'ACOMPANHAMENTO DE CARREIRA',
        subtitle: 'Potencial ainda não avaliado no ciclo oficial',
        description: 'O risco de perda atualmente registrado é baixo. Como o potencial ainda não foi avaliado, a recomendação é acompanhar a evolução antes de formular hipóteses sucessórias.',
        badgeBg: 'bg-gray-100',
        badgeText: 'text-gray-700',
        badgeBorder: 'border-gray-200',
        iconName: 'Compass'
      };
    }
  }

  // GUARD 3: IF succession == NOT_MAPPED -> CANNOT HAVE FORMAL_SUCCESSOR INSIGHT
  if (succession.value === 'NOT_MAPPED' && primaryInsight.code === 'FORMAL_SUCCESSOR') {
    primaryInsight = {
      code: 'REGULAR_PROFILE',
      title: 'PERFIL SEM ALERTA CRÍTICO',
      subtitle: 'Não mapeado no plano formal de sucessão',
      description: 'O colaborador não está no mapa de sucessão formal.',
      badgeBg: 'bg-gray-100',
      badgeText: 'text-gray-700',
      badgeBorder: 'border-gray-200',
      iconName: 'Compass'
    };
  }

  // ─── RECOMENDAÇÕES PROPORCIONAIS ─────────────────────────────────────────
  const recommendations: RecommendationItem[] = [];

  if (risk.value === 'HIGH') {
    recommendations.push({
      type: 'RETENTION',
      title: 'Realizar alinhamento preventivo de retenção (1:1)',
      action: 'Agendar conversa focada em satisfação, motivação e plano de permanência nos próximos 15 dias.',
      rationale: 'Risco de perda elevado registrado na avaliação oficial do gestor.'
    });
  } else if (risk.value === 'LOW' && impact.value === 'HIGH') {
    recommendations.push({
      type: 'RETENTION',
      title: 'Manter monitoramento preventivo de engajamento',
      action: 'Realizar acompanhamentos periódicos de clima e satisfação no trabalho.',
      rationale: 'O risco de saída é baixo, mas o elevado impacto exige atenção contínua.'
    });
  }

  if (potential.value === 'NOT_EVALUATED') {
    recommendations.push({
      type: 'EVALUATION',
      title: 'Realizar avaliação oficial de potencial',
      action: 'Incluir o colaborador no próximo ciclo de avaliação de potencial e prontidão da área.',
      rationale: 'A ausência de dados impede o planejamento sucessório de médio prazo.'
    });
  }

  if (succession.value === 'FORMAL_SUCCESSOR') {
    recommendations.push({
      type: 'LEADERSHIP',
      title: 'Acelerar plano de desenvolvimento sucessório',
      action: 'Inserir ações de mentoria e exposição a decisões estratégicas no PDI.',
      rationale: 'Garantir prontidão para assumir a cadeira designada.'
    });
  } else if (hiddenTalentCode === 'UNMAPPED_TALENT') {
    recommendations.push({
      type: 'CAREER_TALK',
      title: 'Avaliar inclusão no comitê de talentos',
      action: 'Apresentar as evidências de capacidade ao RH/Comitê de Gente.',
      rationale: 'Existem fortes evidências de capacidade acima do escopo atual.'
    });
  }

  recommendations.push({
    type: 'DEVELOPMENT',
    title: 'Alinhar plano de desenvolvimento individual (PDI)',
    action: 'Priorizar competências de maior impacto para consolidação do cargo.',
    rationale: 'Fomenta o crescimento estruturado de competências.'
  });

  // ─── HIPÓTESES DE EVOLUÇÃO ("O QUE PODERIA MUDAR ESTA ANÁLISE?") ──────────
  const whatCouldChange: string[] = [];
  if (potential.value === 'NOT_EVALUATED') {
    whatCouldChange.push('Uma avaliação oficial indicando alto potencial e prontidão estimada elevaria o perfil para indicação sucessória.');
  }
  if (risk.value === 'LOW') {
    whatCouldChange.push('Qualquer nova sinalização de desengajamento ou aumento do risco de perda alteraria a prioridade de retenção.');
  }
  if (succession.value === 'NOT_MAPPED') {
    whatCouldChange.push('A inclusão formal no comitê de gente qualificaria o colaborador como sucessor formal.');
  }

  // ─── TRILHAS DE CARREIRA DIVERSIFICADAS ──────────────────────────────────
  const careerPaths: Array<{
    stage: string;
    title: string;
    type: 'CAMINHO POSSÍVEL' | 'CAMINHO RECOMENDADO' | 'SUCESSÃO FORMAL';
    description: string;
  }> = [
    {
      stage: 'Atual',
      title: m.cargo || 'Cargo Atual',
      type: 'CAMINHO POSSÍVEL',
      description: 'Consolidação e domínio pleno das responsabilidades e entregas do escopo atual.'
    },
    {
      stage: 'Médio Prazo',
      title: /analista/i.test(m.cargo || '') ? 'Especialista Técnico / Consultor' : 'Coordenador / Liderança de Projetos',
      type: succession.value === 'FORMAL_SUCCESSOR' ? 'SUCESSÃO FORMAL' : 'CAMINHO RECOMENDADO',
      description: 'Aprofundamento de complexidade técnica ou coordenação operacional conforme evolução de competências.'
    },
    {
      stage: 'Longo Prazo',
      title: 'Liderança Estratégica / Especialista Sênior',
      type: 'CAMINHO POSSÍVEL',
      description: 'Trajetória futura condicionada a novas avaliações de desempenho, potencial e prontidão.'
    }
  ];

  const whyThisConclusion = {
    factsSummary: `Risco: ${risk.label} | Impacto: ${impact.label} | Sucessão: ${succession.label} | Potencial: ${potential.label}`,
    interpretation: primaryInsight.description,
    recommendationSummary: recommendations[0]?.action || 'Manter plano regular de desenvolvimento.'
  };

  const disclaimer = 'A análise de IA é um apoio à decisão. As conclusões são baseadas nos dados oficiais disponíveis e podem ser limitadas por ausência, desatualização ou inconsistência das informações. A validação final cabe ao gestor e RH.';

  // ─── CONSTRUÇÃO DA EXPLICAÇÃO PROFUNDA E AUDITÁVEL (12 PERGUNTAS / 3 CAMADAS) ──
  const chainOfEvidence: EvidenceChainLink[] = [];

  // Elos da cadeia baseados nos dados reais
  if (risk.value !== 'NOT_EVALUATED') {
    chainOfEvidence.push({
      data: `Risco de Perda Oficial: ${risk.label}`,
      dataInterpretation: risk.value === 'LOW'
        ? 'Indica que o colaborador apresenta baixo índice percebido de desligamento ou turnover no momento.'
        : (risk.value === 'HIGH' ? 'Indica sinalização formal de alta probabilidade de saída voluntária.' : 'Indica atenção moderada a fatores de permanência.'),
      relationToOtherData: `Analisado em conjunto com Impacto de Saída (${impact.label}) e Posicionamento no Mapa (${succession.label}).`,
      conclusion: risk.value === 'LOW' && impact.value === 'HIGH'
        ? 'Risco atual baixo com impacto elevado resulta em Monitoramento Preventivo, sem caracterizar prioridade de retenção por risco alto.'
        : (risk.value === 'HIGH' ? 'Autoriza plano de retenção ativo e acompanhamento semanal.' : 'Posicionamento regular quanto a retenção.'),
      careerImplication: risk.value === 'LOW'
        ? 'Foco de gestão no desenvolvimento regular do PDI sem necessidade de intervenções emergenciais de retenção.'
        : 'Requer alinhamento de expectativas de permanência e satisfação.'
    });
  }

  if (potential.value !== 'NOT_EVALUATED') {
    chainOfEvidence.push({
      data: `Potencial Mapeado: ${potential.label}`,
      dataInterpretation: potential.value === 'HIGH'
        ? 'Sinaliza capacidade para absorção de responsabilidades de maior complexidade conceitual e técnica.'
        : 'Indica capacidade adequada ao escopo atual com margem de crescimento gradativo.',
      relationToOtherData: `Cruzado com o nível de Prontidão (${readiness.label}) e o histórico de Treinamentos PDI (${effectiveTrainings.length} treinamentos eficazes).`,
      conclusion: potential.value === 'HIGH' && succession.value === 'FORMAL_SUCCESSOR'
        ? 'Forte alinhamento para sucessão planejada.'
        : (potential.value === 'HIGH' ? 'Identificado alto potencial em desenvolvimento.' : 'Perfil em consolidação de competências.'),
      careerImplication: 'Orienta a velocidade de delegação de tarefas de maior escopo.'
    });
  } else {
    chainOfEvidence.push({
      data: `Potencial Mapeado: Não Avaliado`,
      dataInterpretation: 'Ausência de registro formal de avaliação de potencial no ciclo recente.',
      relationToOtherData: 'A ausência do dado impede afirmar a existência de alto ou baixo potencial futuro.',
      conclusion: 'O sistema adota postura conservadora e sinaliza a necessidade de incluir o colaborador no ciclo de avaliação.',
      careerImplication: 'Antes de planejar movimentações para posições superiores, realizar ciclo formal de avaliação.'
    });
  }

  // Deep dive de sucessão
  const isTargetRole = /analista/i.test(m.cargo || '') ? 'Especialista / Coordenador' : 'Gerente de Área';
  const successionDeepDive: SuccessionDeepDive = {
    isSuccessor: succession.value === 'FORMAL_SUCCESSOR',
    isFormal: succession.value === 'FORMAL_SUCCESSOR',
    tierLabel: successionTierLabel,
    targetRole: isTargetRole,
    whyMappedOrNot: succession.value === 'FORMAL_SUCCESSOR'
      ? `Mapeado oficialmente no plano de sucessão organizacional para a cadeira de ${isTargetRole}.`
      : (potential.value === 'NOT_EVALUATED'
        ? `Não está no mapa formal. Como potencial e prontidão não foram avaliados no ciclo oficial, não é possível concluir sobre indicação sucessória.`
        : `Não está inserido no mapa formal de sucessão (${succession.label}).`),
    supportingIndicators: evidenceList.map(e => `${e.category}: ${e.text}`),
    readinessHorizon: readiness.label,
    gapsToAddress: dataGaps,
    confidenceAndNextSteps: confidenceReason
  };

  // Trajetória
  const trajectoryAnalysis = {
    pastToPresent: `Admitido em ${m.data_admissao || 'data não informada'} para o cargo de ${m.cargo} em ${m.departamento}. Demonstra evolução consistente no PDI com ${effectiveTrainings.length} treinamentos validados.`,
    presentToFuture: potential.value === 'NOT_EVALUATED'
      ? 'No momento atual, o foco deve ser consolidar as entregas do cargo e realizar a avaliação oficial de potencial para projetar os próximos passos.'
      : `O perfil atual sugere preparação gradativa para posições de maior senioridade (${isTargetRole}) no horizonte de ${readiness.label}.`
  };

  // Deep explanation geral (resposta às 12 perguntas)
  const whyThisClassification = `O colaborador ${m.nome} foi classificado como "${primaryInsight.title}" porque a avaliação oficial indica Risco de Perda: ${risk.label}, Impacto de Saída: ${impact.label}, Mapa de Sucessão: ${succession.label} e Potencial: ${potential.label}. Essa combinação foi processada deterministicamente segundo a matriz oficial de governança.`;

  const whatItMeans = risk.value === 'LOW' && impact.value === 'HIGH'
    ? 'Significa que o profissional ocupa uma vaga de alto impacto para a área, mas com risco atual de desligamento baixo. O gestor deve manter acompanhamento preventivo sem alarme.'
    : (potential.value === 'NOT_EVALUATED'
      ? 'Significa que a atuação no cargo atual segue regular com baixo risco registrado, porém a ausência de avaliação de potencial exige postura conservadora quanto a promoções.'
      : primaryInsight.description);

  const whatItDoesNotMean = risk.value === 'LOW'
    ? 'NÃO significa que o colaborador é imune a insatisfações ou que possui risco zero de saída no futuro. Também NÃO significa que a vaga possa ser negligenciada.'
    : (potential.value === 'NOT_EVALUATED'
      ? 'NÃO significa que o colaborador não tenha capacidade ou tenha "baixo potencial". Apenas indica que o dado formal ainda não foi registrado.'
      : 'NÃO garante promoção automática nem substitui a avaliação qualitativa do gestor no dia a dia.');

  const executiveSummary3Layers = {
    layer1Executive: `SÍNTESE PARA O GESTOR: ${m.nome} atua como ${m.cargo} na área de ${m.departamento}. O diagnóstico oficial é "${primaryInsight.title}". O risco de saída é ${risk.label} e o impacto de eventual substituição é ${impact.label}. ${recommendations[0]?.action || 'Manter o plano de desenvolvimento regular.'}`,
    layer2Analytical: `ANÁLISE EVIDENCIAL: A classificação fundamenta-se nos registros formais (Nível 1) e em ${evidenceList.length} evidências observadas. Risco (${risk.label}) x Impacto (${impact.label}) resultam na matriz "${matrixLabel}". Potencial registrado: ${potential.label}. Prontidão: ${readiness.label}.`,
    layer3Auditable: `PROVENIÊNCIA DE DADOS AUDITÁVEL: Dados extraídos de Avaliação do Gestor (Campo 04: ${m.risco_perda || 'N/A'}, Campo 05: ${m.impacto_saida || 'N/A'}, Campo 02: ${m.mapa_sucessao || 'N/A'}). Grau de confiança: ${confidenceLabel} (${confidenceReason}).`
  };

  return {
    collaborator: {
      id: String(m.id),
      nome: m.nome || 'Colaborador',
      cargo: m.cargo || 'Não informado',
      departamento: m.departamento || 'Não informado',
      superior_imediato: m.superior_imediato || 'Não informado',
      data_admissao: m.data_admissao || 'Não informada'
    },
    officialIndicators: {
      risk: { value: risk.value, label: risk.label, raw: m.risco_perda || '', source: 'Campo 04 - Risco de Perda' },
      impact: { value: impact.value, label: impact.label, raw: m.impacto_saida || '', source: 'Campo 05 - Impacto de Saída' },
      succession: { value: succession.value, label: succession.label, raw: m.mapa_sucessao || '', source: 'Campo 02 - Mapa de Sucessão' },
      potential: { value: potential.value, label: potential.label, raw: m.potencial_crescimento || '', source: 'Avaliação de Potencial' },
      readiness: { value: readiness.value, label: readiness.label, raw: m.nivel_prontidao || '', source: 'Campo 03 - Nível de Prontidão' }
    },
    matrixAssessment: {
      code: matrixCode,
      label: matrixLabel,
      explanation: matrixExplanation
    },
    successionTier: {
      code: successionTierCode,
      label: successionTierLabel,
      evidenceLevel,
      explanation: successionExplanation
    },
    hiddenTalentTier: {
      code: hiddenTalentCode,
      label: hiddenTalentLabel,
      isRare,
      explanation: hiddenTalentExplanation
    },
    evidenceScore,
    confidence: {
      level: confidenceLevel,
      label: confidenceLabel,
      badgeClass: confidenceBadgeClass,
      reason: confidenceReason
    },
    dataFreshness,
    primaryInsight,
    facts,
    evidenceList,
    conflicts,
    dataGaps,
    whatCouldChange,
    whyThisConclusion,
    recommendations,
    careerPaths,
    disclaimer,

    // NOVO REQUISITO: EXPLICAÇÃO PROFUNDA E AUDITÁVEL
    deepExplanation: {
      whyThisClassification,
      whatItMeans,
      whatItDoesNotMean,
      chainOfEvidence,
      successionDeepDive,
      potentialDeepDive: {
        statusLabel: potential.label,
        meaning: potential.value === 'NOT_EVALUATED'
          ? 'Potencial pendente de avaliação no ciclo formal.'
          : `Sinalização formal de capacidade de evolução classificada como "${potential.label}".`,
        whatItDoesNotMean: potential.value === 'NOT_EVALUATED'
          ? 'Não significa ausência de potencial ou baixo desempenho; indica apenas ausência de dado cadastrado.'
          : 'Não implica prontidão imediata para promoção sem o devido cumprimento dos requisitos do cargo.'
      },
      riskImpactDeepDive: {
        riskLabel: risk.label,
        impactLabel: impact.label,
        separationExplanation: `Risco de Perda (${risk.label}) mede a probabilidade percebida de saída. Impacto de Saída (${impact.label}) mede a consequência operacional caso a vaga fique aberta. São dimensões independentes.`
      },
      hiddenTalentDeepDive: {
        statusLabel: hiddenTalentLabel,
        explanation: hiddenTalentExplanation
      },
      gapAnalysisDeep: {
        identifiedGaps: dataGaps,
        impactOnCurrentRole: 'Os gaps identificados devem ser trabalhados nas metas do PDI para garantir autonomia técnica no cargo atual.',
        impactOnFutureRole: 'A resolução dos gaps de competência é pré-requisito para evolução em posições de maior responsabilidade.'
      },
      trajectoryAnalysis,
      executiveSummary3Layers
    }
  };
};
