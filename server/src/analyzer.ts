import { getDb } from './db';
import * as fs from 'fs';
import * as csv from 'csv-parse/sync';
import * as path from 'path';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

interface Competencia {
  id: string;
  id_cargo: string;
  cargo: string;
  competencia: string;
  tipo: string;
  nivel_necessario: string;
}

interface PDIResponse {
  id_colaborador: string;
  treinamento_nome: string;
  q1_conhecimento: string;
  q2_aplicacao: string;
  q3_desempenho: string;
  q4_eficacia: string;
  data_resposta?: string;
  modalidade_treinamento?: string;
  carga_horaria?: string;
  provedor_treinamento?: string;
  custo_treinamento?: string;
  competencia_desenvolvida?: string;
  q5_recomendaria?: string;
  nota_geral_treinamento?: string;
  aplicou_no_trabalho?: string;
}

interface AvaliacaoGestor {
  id_colaborador: string;
  comentarios_soft_skills: string;
  avaliacao_pessoal_texto: string;
  data: string;
  data_avaliacao?: string;
  periodo_referencia?: string;
  nota_desempenho_geral?: string;
  potencial_crescimento?: string;
  comentarios_gestor?: string;
  metas_atingidas?: string;
  numero_de_feedbacks_dados?: string;
  colaborador_tem_pdi_ativo?: string;
  data_ultima_conversa_1_1?: string;
}

interface Colaborador {
  id: string;
  nome: string;
  cargo: string;
  departamento: string;
  gestor_id: string;
  data_admissao?: string;
  status?: string;
  modalidade_trabalho?: string;
  email?: string;
  nivel_cargo?: string;
  centro_de_custo?: string;
  tipo_contrato?: string;
}

export const analyzeCollaborator = async (collaboratorId: string) => {
  const db = await getDb();

  // Fetch collaborator from database
  const collaborator = await db.get('SELECT * FROM collaborators WHERE id = ?', [collaboratorId]) as Colaborador | undefined;
  if (!collaborator) {
    throw new Error('Colaborador não encontrado');
  }

  if (!collaborator.gestor_id || collaborator.cargo.toLowerCase().includes('gestor')) {
    throw new Error('A análise deve ser feita apenas para colaboradores, não gestores.');
  }

  // Load static competencies from CSV
  let competencies: Competencia[] = [];
  try {
    const rootDir = path.join(process.cwd(), '..');
    const compFilePath = path.join(rootDir, 'competencias_por_cargo.csv');
    if (fs.existsSync(compFilePath)) {
      const content = fs.readFileSync(compFilePath, 'utf-8');
      competencies = csv.parse(content, { columns: true, skip_empty_lines: true });
    }
  } catch (e) {
    console.error("Error reading competencies CSV in analyzer", e);
  }
  const competenciasCargo = competencies.filter(c => c.cargo.toLowerCase() === collaborator.cargo.toLowerCase());

  // Fetch PDI responses, evaluations and new feedbacks from database
  const treinamentos = await db.all('SELECT * FROM pdi_responses WHERE id_colaborador = ?', [collaboratorId]) as PDIResponse[];
  const feedbacks = await db.all('SELECT * FROM manager_evaluations WHERE id_colaborador = ?', [collaboratorId]) as AvaliacaoGestor[];
  const newFeedbacks = await db.all('SELECT * FROM feedbacks WHERE id_colaborador = ?', [collaboratorId]);

  const prompt = `Você é um especialista em Recursos Humanos responsável por cruzar as competências exigidas pelo cargo com o perfil atual de um colaborador. Analise se ele atende aos requisitos do cargo atual.
 
**Colaborador:**
- Nome: ${collaborator.nome}
- Cargo: ${collaborator.cargo}
- Departamento: ${collaborator.departamento}
 
**Competências Exigidas para o Cargo:**
${competenciasCargo.map(c => `- ${c.competencia} (Tipo: ${c.tipo}, Nível Necessário: ${c.nivel_necessario})`).join('\n')}
 
**Treinamentos Realizados (PDI):**
${treinamentos.map(t => `- Nome: ${t.treinamento_nome} | Conhecimento: ${t.q1_conhecimento} | Aplicação: ${t.q2_aplicacao} | Desempenho: ${t.q3_desempenho} | Eficácia (Sim/Não): ${t.q4_eficacia}`).join('\n') || "Nenhum treinamento realizado."}
 
**Avaliação do Gestor e Comentários:**
${feedbacks.map(f => `- Data: ${f.data || f.data_avaliacao || ''} | Soft Skills: ${f.comentarios_soft_skills} | Avaliação Texto: ${f.avaliacao_pessoal_texto}`).join('\n') || "Nenhuma avaliação de ciclo encontrada."}

**Novos Feedbacks Registrados:**
${newFeedbacks.map(f => `- Data: ${f.data} | Tipo: ${f.tipo} | Conteúdo: ${f.conteudo}`).join('\n') || "Nenhum feedback adicional."}
 
**Regras da Análise:**
1. Cruzar as competências exigidas com os treinamentos, respostas de avaliação e avaliação do gestor.
2. Considerar que no PDI: Ótimo = impacto alto, Bom = impacto médio, Ruim = impacto negativo. Eficácia "Sim" = reforço positivo, "Não" = alerta de baixa efetividade.
3. A avaliação do gestor serve como evidência qualitativa.
4. Gere um score de "score_meta_requisitos_cargo" em valor numérico inteiro de 0 a 100, baseado nesta aderência.
5. Classificação final baseada no score:
   - 85 a 100: Alta aderência ao cargo
   - 70 a 84: Boa aderência ao cargo
   - 50 a 69: Aderência parcial
   - Abaixo de 50: Baixa aderência ao cargo
 
Você deve responder APENAS E ESTRITAMENTE num formato JSON válido que siga a seguinte estrutura, sem nenhum texto adicional fora do JSON:
{
  "nome": "${collaborator.nome}",
  "cargo": "${collaborator.cargo}",
  "departamento": "${collaborator.departamento}",
  "competencias_exigidas": ["array de strings das competencias formatadas de forma legível (ex: Nome da Competencia (Tipo - Nivel))"],
  "treinamentos_relacionados": ["array de strings apenas com os nomes dos treinamentos"],
  "pontos_importantes": ["array de strings detalhando pontos e destaques importantes do colaborador e do seu momento"],
  "pontos_fortes": ["array de strings detalhando os pontos fortes detectados na analise (positivos)"],
  "pontos_de_atencao": ["array de strings detalhando os gaps/pontos de atencao (negativos)"],
  "evidencias": ["array de strings com as frases de evidencia capturadas da avaliacao do gestor"],
  "score": <numero inteiro de 0 a 100>,
  "classificacao_final": "String da classificacao correspondente",
  "previsao": "Uma previsao detalhada do desenvolvimento ou prontidao futura do colaborador (ex: prontidao de promocao, estabilidade no cargo, ou necessidade de intervencao)",
  "recomendacoes": ["array de strings de recomendacoes acionaveis de RH baseadas no perfil e analise"]
}`;

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY não configurada. Usando fallback dinâmico.");
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const aiResult = response.choices[0]?.message?.content;
    if (!aiResult) {
      throw new Error("Resposta da IA vazia.");
    }
    
    return JSON.parse(aiResult);
  } catch (error) {
    console.log("Usando fallback de geração dinâmica para:", collaborator.nome);

    // Calcular um score dinâmico com base nos treinamentos e feedbacks
    let scoreBase = 70;
    if (treinamentos.length > 0) {
      const parseScoreValue = (value: string) => {
        if (value === 'Ótimo') return 100;
        if (value === 'Bom') return 70;
        if (value === 'Ruim') return 30;
        return 50;
      };
      const sumScores = treinamentos.reduce((acc, t) => {
        const score = (parseScoreValue(t.q1_conhecimento) + parseScoreValue(t.q2_aplicacao) + parseScoreValue(t.q3_desempenho)) / 3;
        return acc + score;
      }, 0);
      scoreBase = sumScores / treinamentos.length;
    }
    
    if (feedbacks.length > 0 || newFeedbacks.length > 0) {
      const text = [
        ...feedbacks.map(f => f.comentarios_soft_skills + " " + f.avaliacao_pessoal_texto),
        ...newFeedbacks.map(f => f.conteudo)
      ].join(" ").toLowerCase();

      if (text.includes("excelente") || text.includes("otimo") || text.includes("destaque") || text.includes("muito bom")) {
        scoreBase += 10;
      }
      if (text.includes("atencao") || text.includes("melhorar") || text.includes("dificuldade") || text.includes("falha")) {
        scoreBase -= 10;
      }
    }
    const score = Math.min(100, Math.max(0, Math.round(scoreBase)));

    let classificacao_final = "Aderência parcial";
    if (score >= 85) classificacao_final = "Alta aderência ao cargo";
    else if (score >= 70) classificacao_final = "Boa aderência ao cargo";
    else if (score < 50) classificacao_final = "Baixa aderência ao cargo";

    const competencias_exigidas = competenciasCargo.map(c => `${c.competencia} (${c.tipo} - ${c.nivel_necessario})`);
    const treinamentos_relacionados = treinamentos.map(t => t.treinamento_nome);
    
    const pontos_importantes = [
      `Colaborador atua na área de ${collaborator.departamento} como ${collaborator.cargo}.`,
      treinamentos.length > 0 
        ? `Já concluiu ${treinamentos.length} treinamentos listados no PDI, demonstrando proatividade.` 
        : `Ainda não possui treinamentos registrados neste ciclo de PDI.`,
      feedbacks.length > 0
        ? `Possui avaliações registradas pelo gestor com foco em desenvolvimento contínuo.`
        : `Sem avaliações recentes do gestor registradas no sistema.`
    ];

    const pontos_fortes: string[] = [];
    const pontos_de_atencao: string[] = [];
    const evidencias: string[] = [];

    if (feedbacks.length > 0) {
      feedbacks.forEach(f => {
        if (f.avaliacao_pessoal_texto) evidencias.push(f.avaliacao_pessoal_texto);
        if (f.comentarios_soft_skills) evidencias.push(`Soft skills: ${f.comentarios_soft_skills}`);
      });

      const fullFeedbackText = feedbacks.map(f => f.avaliacao_pessoal_texto + " " + f.comentarios_soft_skills).join(" ");
      const sentences = fullFeedbackText.split(/[.!?]/);
      sentences.forEach(s => {
        const clean = s.trim();
        if (!clean) return;
        const low = clean.toLowerCase();
        if (low.includes("bom") || low.includes("destaque") || low.includes("facilidade") || low.includes("otimo") || low.includes("excelente") || low.includes("entrega") || low.includes("proativo") || low.includes("lidera") || low.includes("parabens")) {
          if (pontos_fortes.length < 3) pontos_fortes.push(clean);
        } else if (low.includes("atencao") || low.includes("melhorar") || low.includes("desafio") || low.includes("gargalo") || low.includes("dificuldade") || low.includes("falha") || low.includes("falta") || low.includes("precisa")) {
          if (pontos_de_atencao.length < 3) pontos_de_atencao.push(clean);
        }
      });
    }

    if (newFeedbacks.length > 0) {
      newFeedbacks.forEach(f => {
        evidencias.push(`[Feedback ${f.tipo}] ${f.conteudo}`);
        const low = f.conteudo.toLowerCase();
        if (low.includes("bom") || low.includes("parabéns") || low.includes("excelente") || low.includes("ótimo") || low.includes("evolução")) {
          if (pontos_fortes.length < 3) pontos_fortes.push(f.conteudo);
        } else if (low.includes("melhorar") || low.includes("atenção") || low.includes("atraso") || low.includes("dificuldade")) {
          if (pontos_de_atencao.length < 3) pontos_de_atencao.push(f.conteudo);
        }
      });
    }

    // Fallbacks se não encontramos frases específicas
    if (pontos_fortes.length === 0) {
      if (treinamentos.some(t => t.q4_eficacia.toLowerCase() === 'sim')) {
        pontos_fortes.push("Demonstra aplicação prática eficaz dos conhecimentos adquiridos em treinamentos recentes.");
      }
      pontos_fortes.push("Comprometimento com o cronograma de desenvolvimento e atividades do cargo.");
      pontos_fortes.push("Bom relacionamento interpessoal no departamento.");
    }
    if (pontos_de_atencao.length === 0) {
      const ineficazes = treinamentos.filter(t => t.q4_eficacia.toLowerCase() === 'nao');
      if (ineficazes.length > 0) {
        pontos_de_atencao.push(`Treinamento "${ineficazes[0]?.treinamento_nome}" não apresentou a eficácia prática desejada pelo gestor.`);
      }
      if (competenciasCargo.length > treinamentos.length) {
        pontos_de_atencao.push("Necessidade de expandir o escopo do PDI para cobrir competências do cargo ainda não treinadas.");
      }
      pontos_de_atencao.push("Consolidar a autonomia nas tarefas de maior complexidade do escopo atual.");
    }

    // Previsão baseada no score
    let previsao = "";
    if (score >= 85) {
      previsao = `Tendência de alta performance e prontidão para assumir novos desafios ou progressão de carreira nos próximos 6 meses. O colaborador demonstra forte estabilidade e consistência na entrega.`;
    } else if (score >= 70) {
      previsao = `Expectativa de consolidação total no cargo atual nos próximos 3 meses, necessitando apenas de pequenos ajustes técnicos. Baixo risco de turnover técnico.`;
    } else {
      previsao = `Requer atenção de médio prazo. Caso não haja intervenção com mentorias focadas, o colaborador pode apresentar estagnação nas entregas ou dificuldade de acompanhar a evolução da área nos próximos 90 dias.`;
    }

    // Recomendações
    const recomendacoes = [];
    if (treinamentos.some(t => t.q4_eficacia.toLowerCase() === 'nao')) {
      const tName = treinamentos.find(t => t.q4_eficacia.toLowerCase() === 'nao')?.treinamento_nome;
      recomendacoes.push(`Realizar uma sessão de alinhamento 1:1 para entender as barreiras na aplicação prática do treinamento "${tName}".`);
    }
    
    // Sugerir novos treinamentos baseados nas competências do cargo não cobertas
    const competeciasTreinadas = new Set(treinamentos.map(t => t.treinamento_nome.toLowerCase()));
    const compNaoTreinada = competenciasCargo.find(c => !competeciasTreinadas.has(c.competencia.toLowerCase()));
    if (compNaoTreinada) {
      recomendacoes.push(`Incluir ação de desenvolvimento focada em "${compNaoTreinada.competencia}" no próximo ciclo de PDI.`);
    } else {
      recomendacoes.push("Iniciar programa de mentoria reversa para compartilhar conhecimentos fortes com juniores da equipe.");
    }

    recomendacoes.push("Estabelecer marcos claros de entrega quinzenais para acompanhamento de autonomia técnica.");
    recomendacoes.push("Agendar próxima conversa de desenvolvimento individual em 30 dias.");

    if (evidencias.length === 0) {
      evidencias.push("Sem comentários textuais prévios registrados no banco para este colaborador.");
    }

    return {
      nome: collaborator.nome,
      cargo: collaborator.cargo,
      departamento: collaborator.departamento,
      competencias_exigidas,
      treinamentos_relacionados,
      pontos_importantes,
      pontos_fortes,
      pontos_de_atencao,
      evidencias,
      score,
      classificacao_final,
      previsao,
      recomendacoes
    };
  }
};

