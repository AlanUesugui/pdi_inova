import * as xlsx from 'xlsx';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Handling __dirname for both ESM and CJS if needed, 
// but since it's CommonJS (package.json), we can use it directly.
// However, ts-node sometimes complains depending on settings.

interface Collaborator {
  id: string;
  nome: string;
  cargo: string;
  departamento: string;
  gestor_id: string;
}

interface ManagerEvaluation {
  id_colaborador: string;
  comentarios_soft_skills: string;
  avaliacao_pessoal_texto: string;
  data: string;
}

interface PDIResponse {
  id_colaborador: string;
  treinamento_nome: string;
  q1_conhecimento: string;
  q2_aplicacao: string;
  q3_desempenho: string;
  q4_eficacia: string;
}

const SCORE_MAP: Record<string, number> = {
  'Ótimo': 10,
  'Bom': 7,
  'Ruim': 3
};

function calculateReadinessScore(pdi: PDIResponse, managerEval?: ManagerEvaluation): number {
  const q1 = SCORE_MAP[pdi.q1_conhecimento] || 0;
  const q2 = SCORE_MAP[pdi.q2_aplicacao] || 0;
  const q3 = SCORE_MAP[pdi.q3_desempenho] || 0;
  const q4 = pdi.q4_eficacia === 'Sim' ? 5 : 0;

  let pdiScore = (q1 + q2 + q3 + q4) / 3.5;

  if (managerEval) {
    const positiveWords = ['excelente', 'ótimo', 'promissora', 'potencial', 'eficiente'];
    const feedback = managerEval.comentarios_soft_skills.toLowerCase();
    if (positiveWords.some(word => feedback.includes(word))) {
      pdiScore = Math.min(10, pdiScore + 0.5);
    }
  }

  return parseFloat(pdiScore.toFixed(1));
}

function generateAIContext(collab: Collaborator, pdi: PDIResponse, managerEval?: ManagerEvaluation): string {
  return `Colaborador ${collab.nome}, atuando como ${collab.cargo}. PDI em '${pdi.treinamento_nome}' resultou em score de conhecimento ${pdi.q1_conhecimento}. Feedback do gestor: ${managerEval?.comentarios_soft_skills || 'N/A'}. Avaliação pessoal: ${managerEval?.avaliacao_pessoal_texto || 'N/A'}.`;
}

export function processPDIData() {
  // Use process.cwd() to be safe or a fixed path relative to project root
  const dataDir = path.join(process.cwd(), 'data');
  
  try {
    const collabFile = xlsx.readFile(path.join(dataDir, 'colaboradores.csv'));
    const evalFile = xlsx.readFile(path.join(dataDir, 'avaliacoes_gestor.csv'));
    const pdiFile = xlsx.readFile(path.join(dataDir, 'pdi_respostas.csv'));

    const getFirstSheet = (file: xlsx.WorkBook) => {
      const name = file.SheetNames[0];
      if (!name) throw new Error("Arquivo sem planilhas");
      return file.Sheets[name];
    };

    const collaborators: Collaborator[] = xlsx.utils.sheet_to_json(getFirstSheet(collabFile) as xlsx.WorkSheet);
    const evaluations: ManagerEvaluation[] = xlsx.utils.sheet_to_json(getFirstSheet(evalFile) as xlsx.WorkSheet);
    const pdiResponses: PDIResponse[] = xlsx.utils.sheet_to_json(getFirstSheet(pdiFile) as xlsx.WorkSheet);

    const result: any = {
      timestamp: new Date().toISOString(),
      managers: {}
    };

    collaborators.forEach(collab => {
      const managerId = collab.gestor_id;
      if (!result.managers[managerId]) {
        const managerInfo = collaborators.find(c => c.id === managerId);
        result.managers[managerId] = {
          id: managerId,
          name: managerInfo ? managerInfo.nome : 'Unknown Manager',
          team: []
        };
      }

      const collabEval = evaluations.find(e => String(e.id_colaborador) === String(collab.id));
      const collabPDI = pdiResponses.find(p => String(p.id_colaborador) === String(collab.id));

      if (collabPDI) {
        const readinessScore = calculateReadinessScore(collabPDI, collabEval);
        const risk = (readinessScore < 5 || collabPDI.q4_eficacia === 'Não') ? 'High Risk' : 'Healthy';
        
        result.managers[managerId].team.push({
          id: collab.id,
          name: collab.nome,
          role: collab.cargo,
          department: collab.departamento,
          readinessScore,
          aiHealth: risk,
          pdiGoal: collabPDI.treinamento_nome,
          aiInsightContext: generateAIContext(collab, collabPDI, collabEval)
        });
      }
    });

    return result;

  } catch (error) {
    console.error("Data processing failed:", error);
    throw new Error("Erro ao processar arquivos CSV. Verifique a estrutura dos dados.");
  }
}

// Self-test if run directly
if (process.argv[1]?.includes('dataProcessor.ts')) {
  console.log(JSON.stringify(processPDIData(), null, 2));
}
