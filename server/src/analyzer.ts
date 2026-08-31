import { getDb } from './db';
import * as fs from 'fs';
import * as csv from 'csv-parse/sync';
import * as path from 'path';
import * as xlsx from 'xlsx';
import OpenAI from 'openai';
import { buildCuratedAssessment, CuratedCareerAssessment, CareerMemberRawData } from './careerAnalyticsEngine';

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

export const analyzeCollaborator = async (collaboratorId: string) => {
  const db = await getDb();

  // Fetch collaborator from database
  const collaborator = await db.get('SELECT * FROM collaborators WHERE id = ?', [collaboratorId]);
  if (!collaborator) {
    throw new Error('Colaborador não encontrado');
  }

  if (!collaborator.gestor_id || (collaborator.cargo && collaborator.cargo.toLowerCase().includes('gestor'))) {
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
  const competenciasCargo = competencies.filter(c => c.cargo.toLowerCase() === (collaborator.cargo || '').toLowerCase());

  // Load evaluations and curriculos from xlsx
  let rawEval: any = {};
  let rawCV: any = {};
  try {
    const rootDir = path.join(process.cwd(), '..');
    const fEval = xlsx.readFile(path.join(rootDir, 'avaliacoes_gestor.xlsx'));
    const dataEval: any[] = xlsx.utils.sheet_to_json(fEval.Sheets[fEval.SheetNames[0]!] as xlsx.WorkSheet, { defval: '' });
    rawEval = dataEval.find(r => String(r['ID']) === String(collaboratorId) || String(r['id']) === String(collaboratorId)) || {};
  } catch (_) { }

  try {
    const rootDir = path.join(process.cwd(), '..');
    const fCv = xlsx.readFile(path.join(rootDir, 'curriculos.xlsx'));
    const dataCv: any[] = xlsx.utils.sheet_to_json(fCv.Sheets[fCv.SheetNames[0]!] as xlsx.WorkSheet, { defval: '' });
    rawCV = dataCv.find(r => String(r['ID']) === String(collaboratorId) || String(r['id']) === String(collaboratorId)) || {};
  } catch (_) { }

  // Fetch PDI responses, evaluations and new feedbacks from database
  const treinamentos = await db.all('SELECT * FROM pdi_responses WHERE id_colaborador = ?', [collaboratorId]);
  const managerEvalsDb = await db.all('SELECT * FROM manager_evaluations WHERE id_colaborador = ?', [collaboratorId]);
  const newFeedbacks = await db.all('SELECT * FROM feedbacks WHERE id_colaborador = ?', [collaboratorId]);

  const firstEvalDb = managerEvalsDb[0] || {};

  // Build raw member model
  const rawMember: CareerMemberRawData = {
    id: String(collaborator.id),
    nome: collaborator.nome,
    cargo: collaborator.cargo,
    departamento: collaborator.departamento,
    gestor_id: collaborator.gestor_id,
    superior_imediato: collaborator.superior_imediato || 'Gestor Logado',
    data_admissao: collaborator.data_admissao || '',
    fit_cultural: rawEval['01. Fit Cultural'] || '',
    mapa_sucessao: rawEval['02. Mapa de Sucessão'] || '',
    nivel_prontidao: rawEval['03. Nível de Prontidão'] || '',
    risco_perda: rawEval['04. Risco de Perda'] || '',
    impacto_saida: rawEval['05. Impacto de Saída'] || '',
    designacao_sucessao: rawEval['06. Designação de Sucessão'] || '',
    potencial_crescimento: rawEval['potencial_crescimento'] || firstEvalDb.potencial_crescimento || '',
    nota_desempenho: rawEval['nota_desempenho_geral'] || firstEvalDb.nota_desempenho_geral || '',
    comentarios_gestor: rawEval['comentarios_gestor'] || firstEvalDb.comentarios_gestor || firstEvalDb.avaliacao_pessoal_texto || '',
    treinamentos: treinamentos.map(t => ({
      nome: t.treinamento_nome,
      conhecimento: t.q1_conhecimento,
      aplicacao: t.q2_aplicacao,
      desempenho: t.q3_desempenho,
      eficacia: t.q4_eficacia,
      data: t.data_resposta || '',
      carga_horaria: t.carga_horaria || '',
      provedor: t.provedor_treinamento || ''
    })),
    competencias_exigidas: competenciasCargo.map(c => ({
      competencia: c.competencia,
      tipo: c.tipo,
      nivel: c.nivel_necessario
    })),
    feedbacks: newFeedbacks.map(f => ({
      tipo: f.tipo,
      conteudo: f.conteudo,
      data: f.data
    }))
  };

  // Run Deterministic Engine FIRST
  const curatedAssessment = buildCuratedAssessment(rawMember);

  // If OpenAI is available, request text explanation bounded by curatedAssessment
  let aiNarrative = null;
  if (process.env.OPENAI_API_KEY) {
    try {
      const prompt = `Você é um consultor analítico de RH. Sua função é EXPLICAR e SINTETIZAR a análise de carreira do colaborador com base ESTREITA e EXCLUSIVA nos dados oficiais curados fornecidos a seguir.
      
REGRAS ABSOLUTAS:
1. Você NÃO pode alterar nenhuma classificação, código, risco, potencial ou indicação sucessória definida pelo motor determinístico.
2. Se o risco oficial for BAIXO, você NUNCA pode escrever "Risco elevado", "Prioridade de retenção" ou sugerir ameaça iminente de perda.
3. Se o potencial for NÃO AVALIADO, declare explicitamente a ausência de avaliação em vez de inferir potencial.
4. Diga "NÃO HÁ EVIDÊNCIAS SUFICIENTES" caso os dados sejam escassos.
5. Estruture sua resposta estritamente no formato JSON solicitado.

Dados Curados Oficiais:
${JSON.stringify(curatedAssessment, null, 2)}

Formato JSON esperado:
{
  "resumoExecutivo": "síntese profissional de 2 a 3 frases explicando a situação sem contradizer o diagnóstico oficial",
  "narrativaTrajetoria": "explicação do momento de carreira e caminhos futuros possíveis",
  "leituraGestor": "orientações práticas e conservadoras para o gestor"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        aiNarrative = JSON.parse(content);
      }
    } catch (e) {
      console.warn("OpenAI prompt failed or skipped. Using deterministic assessment text.");
    }
  }

  // Calculate score and legacy response fields for backward compatibility
  let scoreBase = 70;
  if (treinamentos.length > 0) {
    const parseScoreValue = (value: string) => {
      if (value === 'Ótimo') return 100;
      if (value === 'Bom') return 70;
      if (value === 'Ruim') return 30;
      return 50;
    };
    const sumScores = treinamentos.reduce((acc: number, t: any) => {
      const s = (parseScoreValue(t.q1_conhecimento) + parseScoreValue(t.q2_aplicacao) + parseScoreValue(t.q3_desempenho)) / 3;
      return acc + s;
    }, 0);
    scoreBase = sumScores / treinamentos.length;
  }
  const score = Math.min(100, Math.max(0, Math.round(scoreBase)));

  let classificacao_final = "Aderência parcial";
  if (score >= 85) classificacao_final = "Alta aderência ao cargo";
  else if (score >= 70) classificacao_final = "Boa aderência ao cargo";
  else if (score < 50) classificacao_final = "Baixa aderência ao cargo";

  return {
    nome: collaborator.nome,
    cargo: collaborator.cargo,
    departamento: collaborator.departamento,
    score,
    classificacao_final,
    curatedAssessment,
    aiNarrative,
    previsao: aiNarrative?.resumoExecutivo || curatedAssessment.whyThisConclusion.interpretation,
    recomendacoes: curatedAssessment.recommendations.map(r => r.action)
  };
};
