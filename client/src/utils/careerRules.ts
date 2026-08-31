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

export interface CareerMemberData {
  id: string;
  nome: string;
  cargo: string;
  departamento: string;
  superior_imediato?: string;
  nivel_cargo?: string;
  data_admissao?: string;
  avatar?: string;
  nivel_escolaridade?: string;
  curso_formacao?: string;
  instituicao?: string;
  idioma?: string;
  nivel_idioma?: string;
  anos_experiencia?: number;
  competencia_tecnica_1?: string;
  competencia_tecnica_2?: string;
  competencia_tecnica_3?: string;
  competencia_comportamental?: string;
  competencia_comportamental_2?: string;
  certificacoes?: string;
  fit_cultural?: string;
  mapa_sucessao?: string;
  nivel_prontidao?: string;
  risco_perda?: string;
  impacto_saida?: string;
  designacao_sucessao?: string;
  potencial_crescimento?: string;
  nota_desempenho?: string;
  comentarios_gestor?: string;
  treinamentos?: CareerTraining[];
  competencias_exigidas?: CompetenciaExigida[];
}

export type SuccessionStatus = 'FORMAL_SUCCESSOR' | 'POTENTIAL_SUCCESSOR' | 'POSSIBLE_POTENTIAL' | 'NOT_MAPPED' | 'NOT_EVALUATED';

export type PotentialStatus = 'HIGH_POTENTIAL' | 'MEDIUM_POTENTIAL' | 'LOW_POTENTIAL' | 'NOT_EVALUATED';

export type ReadinessStatus = 'READY_NOW' | 'READY_SHORT_TERM' | 'READY_MEDIUM_TERM' | 'DEVELOPMENT_NEEDED' | 'NOT_EVALUATED' | 'NOT_IN_MAP';

export type RiskStatus = 'HIGH_RISK' | 'MEDIUM_RISK' | 'LOW_RISK' | 'NOT_EVALUATED';

export type ImpactStatus = 'HIGH_IMPACT' | 'MEDIUM_IMPACT' | 'LOW_IMPACT' | 'NOT_EVALUATED';

export type HiddenTalentStatus = 'UNMAPPED_TALENT' | 'RECOGNIZED_TALENT' | 'POTENTIAL_DEVELOPMENT' | 'ALTERNATIVE_TRAJECTORY' | 'STANDARD_PROFILE';

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

export interface ManagerRecommendation {
  type: 'RETENTION' | 'DEVELOPMENT' | 'LEADERSHIP' | 'CAREER_TALK' | 'SPECIALIZATION' | 'EVALUATION';
  title: string;
  action: string;
  rationale: string;
}

export interface CareerProfileAnalysis {
  isFormalSuccessor: boolean;
  successionStatusLabel: string;
  successionDesignationLabel: string;
  isHighRisk: boolean;
  isMediumRisk: boolean;
  isLowRisk: boolean;
  isHighImpact: boolean;
  isRetentionPriority: boolean;
  retentionPriorityLabel: string;
  potentialStatus: PotentialStatus;
  potentialLabel: string;
  readinessStatus: ReadinessStatus;
  readinessLabel: string;
  riskStatus: RiskStatus;
  riskLabel: string;
  impactStatus: ImpactStatus;
  impactLabel: string;
  hiddenTalentStatus: HiddenTalentStatus;
  classificationName: string;
  capacityEvidences: string[];
  explanationSummary: string;
  whyItMatters: string;
  isInconsistencyDetected: boolean;
  inconsistencyMessage?: string;
  confidenceLabel: string;
  confidenceClass: string;
  confidenceReason: string;
  evidenceScore: number;
  dataGaps: string[];
  whatCouldChange: string[];
  primaryInsight: PrimaryInsight;
  facts: { label: string; value: string; source: string }[];
  evidenceList: { category: string; text: string; level: 'NÍVEL 1 — DADO OFICIAL' | 'NÍVEL 2 — DADO DERIVADO' | 'NÍVEL 3 — INFERÊNCIA' }[];
  recommendations: ManagerRecommendation[];
}

export const parseShortLabel = (raw?: string): string => {
  if (!raw || raw.trim() === '') return 'Não avaliado';
  return raw.split(' - ')[0]?.trim() || raw.trim();
};

export const analyzeCareerProfile = (m: CareerMemberData): CareerProfileAnalysis => {
  const rawSuccession = m.mapa_sucessao || '';
  const rawDesignation = m.designacao_sucessao || '';
  const rawReadiness = m.nivel_prontidao || '';
  const rawRisk = m.risco_perda || '';
  const rawImpact = m.impacto_saida || '';
  const rawPotential = m.potencial_crescimento || '';
  const rawPerformance = m.nota_desempenho || '';

  // 1. NORMALIZAÇÃO DA FONTE DE VERDADE (SOURCE OF TRUTH)
  const riskShort = parseShortLabel(rawRisk);
  const impactShort = parseShortLabel(rawImpact);
  const successionShort = parseShortLabel(rawSuccession);
  const potentialShort = parseShortLabel(rawPotential);
  const readinessShort = parseShortLabel(rawReadiness);

  // STRICT ANCHORED PREFIX MATCHING TO PREVENT SUBSTRING BUGS (e.g. "alto engajamento" inside "Baixo - ...")
  const isHighRisk = /^alto/i.test(riskShort.trim());
  const isMediumRisk = /^médio|^medio/i.test(riskShort.trim());
  const isLowRisk = /^baixo/i.test(riskShort.trim());

  let riskStatus: RiskStatus = 'NOT_EVALUATED';
  if (isHighRisk) riskStatus = 'HIGH_RISK';
  else if (isMediumRisk) riskStatus = 'MEDIUM_RISK';
  else if (isLowRisk) riskStatus = 'LOW_RISK';

  const isHighImpact = /^crítico|^critico|^alto/i.test(impactShort.trim());
  const isMediumImpact = /^médio|^medio/i.test(impactShort.trim());
  const isLowImpact = /^baixo/i.test(impactShort.trim());

  let impactStatus: ImpactStatus = 'NOT_EVALUATED';
  if (isHighImpact) impactStatus = 'HIGH_IMPACT';
  else if (isMediumImpact) impactStatus = 'MEDIUM_IMPACT';
  else if (isLowImpact) impactStatus = 'LOW_IMPACT';

  const isFormalSuccessor = /^sim|^sucessor/i.test(successionShort.trim());
  const isNotInMap = /não está no mapa|nao esta no mapa/i.test(rawSuccession);

  let potentialStatus: PotentialStatus = 'NOT_EVALUATED';
  if (!rawPotential || rawPotential.trim() === '' || /não avaliad|nao avaliad/i.test(potentialShort)) {
    potentialStatus = 'NOT_EVALUATED';
  } else if (/^alto/i.test(potentialShort.trim())) {
    potentialStatus = 'HIGH_POTENTIAL';
  } else if (/^médio|^medio/i.test(potentialShort.trim())) {
    potentialStatus = 'MEDIUM_POTENTIAL';
  } else if (/^baixo/i.test(potentialShort.trim())) {
    potentialStatus = 'LOW_POTENTIAL';
  }

  let readinessStatus: ReadinessStatus = 'NOT_EVALUATED';
  if (!rawReadiness || rawReadiness.trim() === '' || /não avaliad|nao avaliad/i.test(readinessShort)) {
    readinessStatus = 'NOT_EVALUATED';
  } else if (isNotInMap || /não está no mapa|nao esta no mapa/i.test(rawReadiness)) {
    readinessStatus = 'NOT_IN_MAP';
  } else if (/agora|imediata/i.test(readinessShort)) {
    readinessStatus = 'READY_NOW';
  } else if (/6 meses/i.test(readinessShort)) {
    readinessStatus = 'READY_SHORT_TERM';
  } else if (/1.?2 anos|12 meses/i.test(readinessShort)) {
    readinessStatus = 'READY_MEDIUM_TERM';
  } else if (/desenvolviment/i.test(readinessShort)) {
    readinessStatus = 'DEVELOPMENT_NEEDED';
  }

  // 2. DETECÇÃO DE INCONSISTÊNCIAS E CONFLITOS DE DADOS
  let isInconsistencyDetected = false;
  let inconsistencyMessage: string | undefined = undefined;

  if (isNotInMap && /^sim/i.test(parseShortLabel(rawDesignation).trim())) {
    isInconsistencyDetected = true;
    inconsistencyMessage = 'Divergência de registros: O Mapa de Sucessão oficial indica "Não está no mapa", enquanto a designação indica "Sim". A análise adotou a posição oficial conservadora.';
  }

  const successionStatusLabel = isFormalSuccessor
    ? successionShort
    : (isNotInMap ? 'Não está no mapa de sucessão' : successionShort);

  // 3. REGRA ABSOLUTA DE RISCO E MATRIZ RISCO X IMPACTO
  // NUNCA ATIVAR RETENTION_PRIORITY SE RISCO OFICIAL FOR BAIXO OU MÉDIO!
  const isRetentionPriority = isHighRisk; // APENAS RISCO ALTO AUTORIZA PRIORIDADE DE RETENÇÃO

  let retentionPriorityLabel = 'Perfil sem Alerta Crítico de Retenção';
  if (isHighRisk && isHighImpact) {
    retentionPriorityLabel = 'Prioridade Estratégica de Retenção (Risco Alto x Impacto Alto)';
  } else if (isHighRisk) {
    retentionPriorityLabel = 'Atenção à Retenção (Risco Alto)';
  } else if (isMediumRisk && isHighImpact) {
    retentionPriorityLabel = 'Atenção Estratégica (Risco Médio x Impacto Alto)';
  } else if (isLowRisk && isHighImpact) {
    retentionPriorityLabel = 'Monitoramento Preventivo (Risco Baixo x Impacto Alto)';
  } else if (isLowRisk) {
    retentionPriorityLabel = 'Situação Regular de Retenção (Risco Baixo)';
  }

  // 4. COLETA DE EVIDÊNCIAS HIERARQUIZADAS
  const capacityEvidences: string[] = [];
  const evidenceList: { category: string; text: string; level: 'NÍVEL 1 — DADO OFICIAL' | 'NÍVEL 2 — DADO DERIVADO' | 'NÍVEL 3 — INFERÊNCIA' }[] = [];

  if (rawSuccession) {
    evidenceList.push({ category: 'Mapa de Sucessão', text: `Status oficial no Mapa: "${successionStatusLabel}"`, level: 'NÍVEL 1 — DADO OFICIAL' });
  }
  if (rawRisk) {
    evidenceList.push({ category: 'Risco de Perda', text: `Risco de Saída registrado: "${riskShort}"`, level: 'NÍVEL 1 — DADO OFICIAL' });
  }
  if (rawImpact) {
    evidenceList.push({ category: 'Impacto de Saída', text: `Impacto registrado: "${impactShort}"`, level: 'NÍVEL 1 — DADO OFICIAL' });
  }
  if (potentialStatus !== 'NOT_EVALUATED') {
    evidenceList.push({ category: 'Potencial Mapeado', text: `Potencial registrado: "${potentialShort}"`, level: 'NÍVEL 1 — DADO OFICIAL' });
  }

  const isReadySoon = readinessStatus === 'READY_NOW' || readinessStatus === 'READY_SHORT_TERM';
  if (isReadySoon) {
    capacityEvidences.push(`Prontidão estimada em curto prazo (${readinessShort})`);
    evidenceList.push({ category: 'Prontidão', text: `Estimativa de prontidão em curto prazo: ${readinessShort}`, level: 'NÍVEL 1 — DADO OFICIAL' });
  }

  const perfNum = parseFloat(rawPerformance);
  const isHighPerformance = (!isNaN(perfNum) && perfNum >= 4.0) || /alto|excelente|supera/i.test(rawPerformance);
  if (isHighPerformance) {
    capacityEvidences.push(`Desempenho elevado registrado (${rawPerformance})`);
    evidenceList.push({ category: 'Desempenho', text: `Nota de desempenho recente: ${rawPerformance}`, level: 'NÍVEL 2 — DADO DERIVADO' });
  }

  const effectiveTrainingsCount = (m.treinamentos || []).filter(t => t.eficacia === 'Sim').length;
  if (effectiveTrainingsCount >= 2) {
    capacityEvidences.push(`${effectiveTrainingsCount} treinamentos com eficácia comprovada`);
    evidenceList.push({ category: 'Capacitação', text: `${effectiveTrainingsCount} treinamentos concluídos com aplicação eficaz comprovada`, level: 'NÍVEL 2 — DADO DERIVADO' });
  }

  const isManagerFavorable = !!m.comentarios_gestor && /excelente|destaque|promissor|supera|evolução|crescimento|ótimo|liderança/i.test(m.comentarios_gestor);
  if (isManagerFavorable) {
    capacityEvidences.push(`Comentários do gestor favoráveis`);
    evidenceList.push({ category: 'Feedback do Gestor', text: `Avaliação qualitativa favorável: "${m.comentarios_gestor && m.comentarios_gestor.length > 60 ? m.comentarios_gestor.substring(0, 60) + '...' : m.comentarios_gestor}"`, level: 'NÍVEL 2 — DADO DERIVADO' });
  }

  // 5. LACUNAS DA ANÁLISE (DATA GAPS)
  const dataGaps: string[] = [];
  if (potentialStatus === 'NOT_EVALUATED') dataGaps.push('Potencial de crescimento ainda não avaliado no ciclo oficial.');
  if (readinessStatus === 'NOT_EVALUATED' || readinessStatus === 'NOT_IN_MAP') dataGaps.push('Prontidão sucessória ainda não avaliada ou fora do mapa formal.');
  if (!rawPerformance) dataGaps.push('Avaliação quantitativa de desempenho do ciclo pendente.');
  if (!m.treinamentos || m.treinamentos.length === 0) dataGaps.push('Sem treinamentos com eficácia registrada no ciclo atual.');

  // 6. SCORE DE EVIDÊNCIAS & CONFIANÇA
  let evidenceScore = 0;
  if (riskStatus !== 'NOT_EVALUATED') evidenceScore++;
  if (impactStatus !== 'NOT_EVALUATED') evidenceScore++;
  if (successionStatusLabel && !isNotInMap) evidenceScore++;
  if (potentialStatus !== 'NOT_EVALUATED') evidenceScore++;
  if (readinessStatus !== 'NOT_EVALUATED' && readinessStatus !== 'NOT_IN_MAP') evidenceScore++;
  if (capacityEvidences.length > 0) evidenceScore += Math.min(2, capacityEvidences.length);

  let confidenceLabel = 'Confiança moderada';
  let confidenceClass = 'bg-amber-50 text-amber-700 border-amber-200';
  let confidenceReason = '';

  if (evidenceScore >= 5) {
    confidenceLabel = 'Alta confiança';
    confidenceClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    confidenceReason = 'Alta confiança porque existem dados cadastrados em múltiplas dimensões oficiais (risco, impacto, sucessão, desempenho).';
  } else if (evidenceScore >= 3) {
    confidenceLabel = 'Confiança moderada';
    confidenceClass = 'bg-amber-50 text-amber-700 border-amber-200';
    confidenceReason = 'Confiança moderada baseada em indicadores existentes, porém com lacunas em potencial ou prontidão.';
  } else if (evidenceScore >= 1) {
    confidenceLabel = 'Confiança limitada';
    confidenceClass = 'bg-orange-50 text-orange-700 border-orange-200';
    confidenceReason = 'Confiança limitada devido à ausência de avaliações estruturadas no cadastro.';
  } else {
    confidenceLabel = 'Sem evidência suficiente';
    confidenceClass = 'bg-gray-100 text-gray-600 border-gray-200';
    confidenceReason = 'Dados insuficientes na base para formular diagnósticos preditivos de carreira.';
  }

  // 7. HIERARQUIA DE TALENTOS E CLASSIFICAÇÃO
  const isUnmappedTalent = !isFormalSuccessor && potentialStatus === 'HIGH_POTENTIAL' && isNotInMap && capacityEvidences.length >= 2 && evidenceScore >= 4;
  const isRecognizedTalent = !isFormalSuccessor && potentialStatus === 'HIGH_POTENTIAL' && !isUnmappedTalent;
  const isPotentialDevelopment = !isFormalSuccessor && !isRecognizedTalent && !isUnmappedTalent &&
    (potentialStatus === 'MEDIUM_POTENTIAL' || isHighPerformance || isReadySoon);

  let hiddenTalentStatus: HiddenTalentStatus = 'STANDARD_PROFILE';
  let classificationName = 'Perfil Padrão';

  if (isFormalSuccessor) {
    hiddenTalentStatus = 'STANDARD_PROFILE';
    classificationName = 'Sucessor formal';
  } else if (isUnmappedTalent) {
    hiddenTalentStatus = 'UNMAPPED_TALENT';
    classificationName = 'Possível talento não mapeado';
  } else if (isRecognizedTalent) {
    hiddenTalentStatus = 'RECOGNIZED_TALENT';
    classificationName = 'Talento reconhecido';
  } else if (isPotentialDevelopment) {
    hiddenTalentStatus = 'POTENTIAL_DEVELOPMENT';
    classificationName = 'Potencial de desenvolvimento';
  }

  // 8. DIAGNÓSTICO PRINCIPAL (PRIMARY CAREER INSIGHT) E VALIDAÇÕES DE BLOQUEIO
  let primaryInsight: PrimaryInsight;

  if (isInconsistencyDetected) {
    primaryInsight = {
      code: 'DATA_CONFLICT',
      title: 'INCONSISTÊNCIA DE DADOS IDENTIFICADA',
      subtitle: 'Divergência registrada entre indicadores formais na base',
      description: inconsistencyMessage || 'Identificada inconsistência nos registros. Adotado posicionamento conservador baseado na fonte de verdade oficial.',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      badgeBorder: 'border-amber-200',
      iconName: 'ShieldAlert'
    };
  } else if (isHighRisk) {
    primaryInsight = {
      code: isHighImpact ? 'STRATEGIC_RETENTION_PRIORITY' : 'RETENTION_ATTENTION',
      title: isHighImpact ? 'PRIORIDADE ESTRATÉGICA DE RETENÇÃO' : 'ATENÇÃO À RETENÇÃO',
      subtitle: 'Risco elevado de perda registrado na avaliação formal',
      description: isFormalSuccessor
        ? 'O colaborador é sucessor formal mapeado e apresenta risco elevado de saída registrado na base. Exige plano de retenção imediato.'
        : 'O colaborador apresenta risco elevado de perda registrado na avaliação formal de retenção.',
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-700',
      badgeBorder: 'border-rose-200',
      iconName: 'ShieldAlert'
    };
  } else if (isLowRisk && isHighImpact) {
    primaryInsight = {
      code: 'PREVENTIVE_MONITORING',
      title: 'MONITORAMENTO PREVENTIVO',
      subtitle: 'Risco de perda baixo com impacto elevado em caso de saída',
      description: 'O risco de saída registrado é baixo. A recomendação de acompanhamento decorre do alto impacto potencial da saída, não de um risco elevado.',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-700',
      badgeBorder: 'border-blue-200',
      iconName: 'ShieldCheck'
    };
  } else if (isFormalSuccessor) {
    primaryInsight = {
      code: 'FORMAL_SUCCESSOR',
      title: 'SUCESSOR MAPEADO',
      subtitle: 'Mapeado formalmente para substituição em cadeira chave',
      description: `O colaborador está formalmente registrado como sucessor (${successionShort}). Apresenta situação regular de retenção.`,
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      badgeBorder: 'border-emerald-200',
      iconName: 'ShieldCheck'
    };
  } else if (isUnmappedTalent) {
    primaryInsight = {
      code: 'UNMAPPED_TALENT',
      title: 'POSSÍVEL TALENTO NÃO MAPEADO',
      subtitle: 'Evidências de capacidade superiores sem mapeamento formal',
      description: 'Identificada combinação de alto potencial com múltiplas evidências de desempenho, porém o colaborador ainda não consta no mapa de sucessão.',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      badgeBorder: 'border-amber-200',
      iconName: 'Zap'
    };
  } else if (isRecognizedTalent) {
    primaryInsight = {
      code: 'RECOGNIZED_TALENT',
      title: 'TALENTO RECONHECIDO',
      subtitle: 'Perfil de alto potencial registrado em desenvolvimento',
      description: 'Reconhecido pelo seu alto potencial de crescimento e contribuição para a organização.',
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-700',
      badgeBorder: 'border-purple-200',
      iconName: 'Sparkles'
    };
  } else if (potentialStatus === 'NOT_EVALUATED' && isLowRisk) {
    primaryInsight = {
      code: 'CAREER_ACCOMPANIMENT',
      title: 'ACOMPANHAMENTO DE CARREIRA',
      subtitle: 'Risco de perda baixo. Potencial pendente de avaliação oficial',
      description: 'O risco de perda atualmente registrado é baixo. Não existem evidências suficientes para classificar o colaborador como prioridade de retenção. Como potencial e prontidão ainda não estão avaliados, recomenda-se acompanhar a evolução antes de formular hipóteses sucessórias.',
      badgeBg: 'bg-gray-100',
      badgeText: 'text-gray-700',
      badgeBorder: 'border-gray-200',
      iconName: 'Compass'
    };
  } else if (isPotentialDevelopment) {
    primaryInsight = {
      code: 'POTENTIAL_DEVELOPMENT',
      title: 'POTENCIAL DE DESENVOLVIMENTO',
      subtitle: 'Trajetória em evolução constante no cargo atual',
      description: 'Apresenta perspectiva favorável para ampliação gradual de responsabilidades.',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-700',
      badgeBorder: 'border-blue-200',
      iconName: 'TrendingUp'
    };
  } else {
    primaryInsight = {
      code: 'REGULAR_PROFILE',
      title: 'PERFIL SEM ALERTA CRÍTICO',
      subtitle: 'Acompanhamento regular de carreira e metas de desenvolvimento',
      description: 'O colaborador não apresenta alertas de retenção ou riscos críticos. O desenvolvimento deve focar as metas do PDI.',
      badgeBg: 'bg-gray-100',
      badgeText: 'text-gray-700',
      badgeBorder: 'border-gray-200',
      iconName: 'Compass'
    };
  }

  // 9. RECOMENDAÇÕES CONTEXTUALIZADAS E PROPORCIONAIS
  const recommendations: ManagerRecommendation[] = [];

  if (isHighRisk) {
    recommendations.push({
      type: 'RETENTION',
      title: 'Realizar conversa estruturada de retenção (1:1)',
      action: 'Agendar alinhamento sobre satisfação e plano de carreira nos próximos 15 dias.',
      rationale: 'O colaborador apresenta risco elevado de saída registrado na base oficial.'
    });
  } else if (isLowRisk && isHighImpact) {
    recommendations.push({
      type: 'RETENTION',
      title: 'Manter acompanhamento preventivo de engajamento',
      action: 'Realizar acompanhamentos periódicos de clima e satisfação no trabalho.',
      rationale: 'O risco atual é baixo, mas o elevado impacto exige atenção contínua.'
    });
  }

  if (potentialStatus === 'NOT_EVALUATED') {
    recommendations.push({
      type: 'EVALUATION',
      title: 'Realizar avaliação oficial de potencial',
      action: 'Incluir o colaborador no próximo ciclo de avaliação de potencial e prontidão da área.',
      rationale: 'Realizar avaliação de potencial e acompanhar evolução antes de concluir sobre trajetória sucessória.'
    });
  }

  if (isFormalSuccessor) {
    recommendations.push({
      type: 'LEADERSHIP',
      title: 'Acelerar plano de prontidão sucessória',
      action: 'Incluir no PDI mentoria com lideranças seniores e exposição a projetos estratégicos.',
      rationale: 'O colaborador é sucessor mapeado para cadeira-chave.'
    });
  }

  recommendations.push({
    type: 'DEVELOPMENT',
    title: 'Alinhar metas de desenvolvimento no PDI',
    action: 'Priorizar as competências de menor aderência no próximo ciclo de desenvolvimento.',
    rationale: 'Garante evolução contínua alinhada às exigências do cargo.'
  });

  // 10. RACIONAL E EXPLICAÇÕES
  let explanationSummary = '';
  let whyItMatters = '';

  if (isLowRisk && isHighImpact) {
    explanationSummary = 'Colaborador com baixo risco de perda registrado, porém com impacto de saída classificado como elevado.';
    whyItMatters = 'O risco atual permanece baixo. A recomendação de acompanhamento decorre do impacto potencial da saída, não de um risco elevado.';
  } else if (potentialStatus === 'NOT_EVALUATED') {
    explanationSummary = 'O risco de perda atualmente registrado é baixo. Potencial e prontidão ainda não foram avaliados oficialmente.';
    whyItMatters = 'Como os indicadores de futuro estão pendentes, o sistema assume postura conservadora e recomenda realização de avaliação.';
  } else if (isFormalSuccessor) {
    explanationSummary = 'Colaborador formalmente identificado no planejamento sucessório da organização.';
    whyItMatters = 'Garante continuidade operacional e prontidão para posições estratégicas.';
  } else {
    explanationSummary = 'Perfil sem alertas críticos de retenção, avaliado conforme o plano de acompanhamento regular da área.';
    whyItMatters = 'Suporta a evolução gradual de competências e a consolidação das metas do PDI.';
  }

  const whatCouldChange: string[] = [];
  if (potentialStatus === 'NOT_EVALUATED') {
    whatCouldChange.push('Uma avaliação de potencial alta e evidências de prontidão poderiam elevar o perfil para potencial sucessório.');
  }
  if (isLowRisk) {
    whatCouldChange.push('Uma nova avaliação indicando aumento do risco de perda poderia alterar a prioridade de retenção.');
  }

  const facts = [
    { label: 'Cargo Atual', value: m.cargo, source: 'Cadastro do Colaborador' },
    { label: 'Departamento', value: m.departamento, source: 'Estrutura Organizacional' },
    { label: 'Gestor Direto', value: m.superior_imediato || 'Não informado', source: 'Tabela de Gestores' },
    { label: 'Posição no Mapa', value: successionStatusLabel, source: 'Avaliação do Gestor (02. Mapa de Sucessão)' },
    { label: 'Risco de Perda', value: riskShort, source: 'Avaliação do Gestor (04. Risco de Perda)' },
    { label: 'Impacto de Saída', value: impactShort, source: 'Avaliação do Gestor (05. Impacto de Saída)' },
    { label: 'Potencial Mapeado', value: potentialShort, source: 'Avaliação do Gestor (Potencial)' },
    { label: 'Prontidão Estimada', value: readinessShort, source: 'Avaliação do Gestor (03. Prontidão)' },
  ];

  return {
    isFormalSuccessor,
    successionStatusLabel,
    successionDesignationLabel: parseShortLabel(rawDesignation),
    isHighRisk,
    isMediumRisk,
    isLowRisk,
    isHighImpact,
    isRetentionPriority,
    retentionPriorityLabel,
    potentialStatus,
    potentialLabel: potentialShort,
    readinessStatus,
    readinessLabel: readinessShort,
    riskStatus,
    riskLabel: riskShort,
    impactStatus,
    impactLabel: impactShort,
    hiddenTalentStatus,
    classificationName,
    capacityEvidences,
    explanationSummary,
    whyItMatters,
    isInconsistencyDetected,
    inconsistencyMessage,
    confidenceLabel,
    confidenceClass,
    confidenceReason,
    evidenceScore,
    dataGaps,
    whatCouldChange,
    primaryInsight,
    facts,
    evidenceList,
    recommendations
  };
};
