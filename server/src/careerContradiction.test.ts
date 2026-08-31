import { buildCuratedAssessment, CareerMemberRawData } from './careerAnalyticsEngine';

function runTests() {
  console.log("=================================================");
  console.log(" EXECUTANDO TESTES DE CONTRADIÇÃO E CONSISTÊNCIA ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${detail || 'Validação falhou'}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // TESTE 1: Risco BAIXO não pode virar PRIORIDADE DE RETENÇÃO
  // ---------------------------------------------------------------------------
  const test1Member: CareerMemberRawData = {
    id: '101',
    nome: 'Teste Risco Baixo',
    cargo: 'Analista',
    departamento: 'TI',
    risco_perda: 'Baixo - Recém promovida, alto engajamento',
    impacto_saida: 'Baixo - Fácil substituição',
    mapa_sucessao: 'Não está no mapa de sucessão',
    potencial_crescimento: 'Médio',
    nivel_prontidao: 'Em desenvolvimento'
  };
  const res1 = buildCuratedAssessment(test1Member);
  assert(
    res1.primaryInsight.code !== 'STRATEGIC_RETENTION_PRIORITY' && res1.primaryInsight.code !== 'RETENTION_ATTENTION',
    'TESTE 1: LOW risk + HIGH retention priority blocker',
    `Código obtido: ${res1.primaryInsight.code}`
  );

  // ---------------------------------------------------------------------------
  // TESTE 2: Potencial NÃO AVALIADO não pode virar ALTO POTENCIAL
  // ---------------------------------------------------------------------------
  const test2Member: CareerMemberRawData = {
    id: '102',
    nome: 'Teste Potencial Ausente',
    cargo: 'Analista',
    departamento: 'TI',
    risco_perda: 'Baixo',
    impacto_saida: 'Baixo',
    mapa_sucessao: 'Não está no mapa de sucessão',
    potencial_crescimento: '',
    nivel_prontidao: ''
  };
  const res2 = buildCuratedAssessment(test2Member);
  assert(
    res2.officialIndicators.potential.value === 'NOT_EVALUATED',
    'TESTE 2: NOT_EVALUATED potential preserved as NOT_EVALUATED',
    `Valor obtido: ${res2.officialIndicators.potential.value}`
  );

  // ---------------------------------------------------------------------------
  // TESTE 3: Sucessão NÃO MAPEADA não pode virar SUCESSOR FORMAL
  // ---------------------------------------------------------------------------
  const test3Member: CareerMemberRawData = {
    id: '103',
    nome: 'Teste Sem Sucessão',
    cargo: 'Analista',
    departamento: 'TI',
    mapa_sucessao: 'Não está no mapa de sucessão'
  };
  const res3 = buildCuratedAssessment(test3Member);
  assert(
    res3.officialIndicators.succession.value === 'NOT_MAPPED' && res3.primaryInsight.code !== 'FORMAL_SUCCESSOR',
    'TESTE 3: NOT_MAPPED succession blocked from FORMAL_SUCCESSOR',
    `Código obtido: ${res3.primaryInsight.code}`
  );

  // ---------------------------------------------------------------------------
  // TESTE 4: Prontidão NÃO AVALIADA não pode virar PRONTO AGORA
  // ---------------------------------------------------------------------------
  const test4Member: CareerMemberRawData = {
    id: '104',
    nome: 'Teste Prontidão Ausente',
    cargo: 'Analista',
    departamento: 'TI',
    nivel_prontidao: ''
  };
  const res4 = buildCuratedAssessment(test4Member);
  assert(
    res4.officialIndicators.readiness.value === 'NOT_EVALUATED',
    'TESTE 4: NOT_EVALUATED readiness preserved as NOT_EVALUATED',
    `Valor obtido: ${res4.officialIndicators.readiness.value}`
  );

  // ---------------------------------------------------------------------------
  // TESTE 5: Risco BAIXO + Impacto ALTO deve virar MONITORAMENTO PREVENTIVO
  // ---------------------------------------------------------------------------
  const test5Member: CareerMemberRawData = {
    id: '105',
    nome: 'Teste Risco Baixo Impacto Alto',
    cargo: 'Analista Sênior',
    departamento: 'Engenharia',
    risco_perda: 'Baixo - Estável',
    impacto_saida: 'Crítico - Alta dependência técnica'
  };
  const res5 = buildCuratedAssessment(test5Member);
  assert(
    res5.primaryInsight.code === 'PREVENTIVE_MONITORING' && res5.matrixAssessment.code === 'LOW_HIGH',
    'TESTE 5: LOW risk + HIGH impact generates PREVENTIVE_MONITORING',
    `Código obtido: ${res5.primaryInsight.code}, Matriz: ${res5.matrixAssessment.code}`
  );

  // ---------------------------------------------------------------------------
  // TESTE 6: Risco ALTO + Confiança BAIXA deve reportar Confiança Limitada/Moderada
  // ---------------------------------------------------------------------------
  const test6Member: CareerMemberRawData = {
    id: '106',
    nome: 'Teste Risco Alto Sem Dados',
    cargo: 'Analista',
    departamento: 'TI',
    risco_perda: 'Alto - Risco de saída'
  };
  const res6 = buildCuratedAssessment(test6Member);
  assert(
    res6.officialIndicators.risk.value === 'HIGH' && (res6.confidence.level === 'LOW_CONFIDENCE' || res6.confidence.level === 'INSUFFICIENT_DATA'),
    'TESTE 6: HIGH risk + Low evidence reports Low/Insufficient Confidence',
    `Confiança: ${res6.confidence.level}`
  );

  // ---------------------------------------------------------------------------
  // TESTE 7: Avaliação Antiga/Registrada preserva a data de referência
  // ---------------------------------------------------------------------------
  const test7Member: CareerMemberRawData = {
    id: '107',
    nome: 'Teste Data Antiga',
    cargo: 'Analista',
    departamento: 'TI',
    evaluationsHistory: [{ data: '2023-05-10', risco: 'Médio' }]
  };
  const res7 = buildCuratedAssessment(test7Member);
  assert(
    res7.dataFreshness.lastEvaluationDate === '2023-05-10',
    'TESTE 7: Old evaluation dates are properly tracked',
    `Data obtida: ${res7.dataFreshness.lastEvaluationDate}`
  );

  // ---------------------------------------------------------------------------
  // TESTE 8: Ausência total de dados gera DADOS INSUFICIENTES
  // ---------------------------------------------------------------------------
  const test8Member: CareerMemberRawData = {
    id: '108',
    nome: 'Teste Sem Dados',
    cargo: 'Analista',
    departamento: 'TI'
  };
  const res8 = buildCuratedAssessment(test8Member);
  assert(
    res8.confidence.level === 'INSUFFICIENT_DATA' || res8.primaryInsight.code === 'INSUFFICIENT_DATA' || res8.primaryInsight.code === 'REGULAR_PROFILE',
    'TESTE 8: Missing data handled conservatively',
    `Insight obtido: ${res8.primaryInsight.code}`
  );

  // ---------------------------------------------------------------------------
  // TESTE 9: Indicadores conflitantes geram DIVERGÊNCIA IDENTIFICADA
  // ---------------------------------------------------------------------------
  const test9Member: CareerMemberRawData = {
    id: '109',
    nome: 'Teste Conflito Sucessao',
    cargo: 'Analista',
    departamento: 'TI',
    mapa_sucessao: 'Não está no mapa de sucessão',
    designacao_sucessao: 'Sim - Sucessor imediato de gerente'
  };
  const res9 = buildCuratedAssessment(test9Member);
  assert(
    res9.conflicts.length > 0 || res9.primaryInsight.code === 'DATA_CONFLICT',
    'TESTE 9: Conflicting records generate DATA_CONFLICT or conflict flag',
    `Conflitos encontrados: ${res9.conflicts.length}`
  );

  // ---------------------------------------------------------------------------
  // TESTE 10: CASO ESPECÍFICO — VINÍCIUS ARAÚJO (ID 199)
  // ---------------------------------------------------------------------------
  const viniciusMember: CareerMemberRawData = {
    id: '199',
    nome: 'Vinícius Araújo',
    cargo: 'Analista Júnior',
    departamento: 'Tecnologia da Informação',
    gestor_id: '2',
    superior_imediato: 'Bruno Cardoso',
    fit_cultural: 'Baixo - Apresenta desvios comportamentais frequentes',
    mapa_sucessao: 'Não está no mapa de sucessão',
    nivel_prontidao: 'Não está no mapa de sucessão',
    risco_perda: 'Baixo - Recém promovida, alto engajamento',
    impacto_saida: 'Médio - Atividades absorvíveis pela equipe com esforço',
    designacao_sucessao: 'Não - Posição sem sucessor mapeado',
    potencial_crescimento: '',
    nota_desempenho: ''
  };
  const resVinicius = buildCuratedAssessment(viniciusMember);

  assert(
    resVinicius.officialIndicators.risk.value === 'LOW',
    'TESTE 10 (Vinícius): Risco oficial é BAIXO',
    `Risco obtido: ${resVinicius.officialIndicators.risk.value}`
  );
  assert(
    resVinicius.primaryInsight.code !== 'STRATEGIC_RETENTION_PRIORITY' && resVinicius.primaryInsight.code !== 'RETENTION_ATTENTION',
    'TESTE 10 (Vinícius): PROIBIDO gerar Prioridade de Retenção ou Risco Elevado',
    `Insight obtido: ${resVinicius.primaryInsight.title}`
  );
  assert(
    resVinicius.officialIndicators.potential.value === 'NOT_EVALUATED',
    'TESTE 10 (Vinícius): Potencial permanece NÃO AVALIADO',
    `Potencial obtido: ${resVinicius.officialIndicators.potential.value}`
  );
  assert(
    resVinicius.officialIndicators.succession.value === 'NOT_MAPPED',
    'TESTE 10 (Vinícius): Sucessão permanece NÃO MAPEADO',
    `Sucessão obtida: ${resVinicius.officialIndicators.succession.value}`
  );

  console.log("\n=================================================");
  console.log(` RESULTADO FINAL: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
