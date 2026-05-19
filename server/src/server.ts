import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { runPDIAgentChain } from './agents';
import { mockTeam, calculateAIHealth } from './team';
import { processPDIData } from './dataProcessor';
import { getDb, initSchema } from './db';
import { analyzeCollaborator } from './analyzer';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// Initialize DB
initSchema().then(() => console.log("Database Schema Ready"));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/analyze', async (req, res) => {
  const { profileData, jd } = req.body;
  
  // Simulate RAG/Agent processing
  try {
    const result = await runPDIAgentChain(
      profileData || {
        pastExperiences: ["Dev Senior na TechCorp", "Líder na Innovate"],
        currentSkills: ["React", "Node", "Design de Sistemas"],
        trainingHistory: ["Liderança 101", "Arquitetura Avançada"]
      },
      jd || "Diretor Executivo de Engenharia"
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Agent analysis failed" });
  }
});

app.get('/api/analyze-collaborator/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await analyzeCollaborator(id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/team', async (req, res) => {
  const { managerId } = req.query;
  const db = await getDb();
  
  let query = 'SELECT c.*, e.comentarios_soft_skills, e.avaliacao_pessoal_texto, e.data as eval_date FROM collaborators c LEFT JOIN manager_evaluations e ON c.id = e.id_colaborador';
  let params: any[] = [];
  
  if (managerId) {
    query += ' WHERE c.gestor_id = ?';
    params.push(managerId);
  }
  
  const collaborators = await db.all(query, params);
  const pdiResponses = await db.all('SELECT * FROM pdi_responses');

  const teamWithHealth = collaborators.map(collab => {
    const pdis = pdiResponses.filter(p => String(p.id_colaborador) === String(collab.id));
    
    const pdiHistory = pdis.map(pdi => {
      const parseScore = (value: string) => {
        if (value === 'Ótimo') return 100;
        if (value === 'Bom') return 70;
        if (value === 'Ruim') return 30;
        return 50;
      };
      const score = Math.round((parseScore(pdi.q1_conhecimento) + parseScore(pdi.q2_aplicacao) + parseScore(pdi.q3_desempenho)) / 3);
      return {
        treinamento_nome: pdi.treinamento_nome,
        conhecimento: pdi.q1_conhecimento,
        aplicacao: pdi.q2_aplicacao,
        desempenho: pdi.q3_desempenho,
        eficacia: pdi.q4_eficacia,
        score: score
      };
    });

    const averageProgress = pdiHistory.length > 0 
      ? Math.round(pdiHistory.reduce((acc, curr) => acc + curr.score, 0) / pdiHistory.length) 
      : 0;
    
    return {
      id: String(collab.id),
      name: collab.nome,
      role: collab.cargo,
      level: collab.cargo.toUpperCase(), // Fallback
      pdiHistory: pdiHistory,
      pdiAverage: averageProgress,
      pdiGoal: pdis.length > 0 ? `${pdis.length} Treinamentos` : 'Nenhum PDI Ativo',
      pdiProgress: averageProgress, // Mantendo a chave pra não quebrar coisas não atualizadas
      lastUpdate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      seniority: 'Senior', // Fallback
      retentionRisk: 'Low', // Fallback
      aiHealth: calculateAIHealth({ pdiProgress: averageProgress, lastUpdate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) } as any),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(collab.nome)}&background=random`,
      skills: ["React", "Node.js", "SQL"],
      evaluation: collab.avaliacao_pessoal_texto ? {
        comment: collab.avaliacao_pessoal_texto,
        softSkills: collab.comentarios_soft_skills,
        date: collab.eval_date
      } : null
    };
  });

  // Sort by AI Health Risk
  const sortedTeam = teamWithHealth.sort((a, b) => {
    const score = { 'Risk': 3, 'Attention': 2, 'Healthy': 1 };
    return (score as any)[b.aiHealth] - (score as any)[a.aiHealth];
  });

  res.json(sortedTeam);
});

app.get('/api/pdi-stats', (req, res) => {
  try {
    const data = processPDIData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const emailTrimmed = email?.trim();
  const passwordTrimmed = password?.trim();
  const db = await getDb();
  
  console.log(`Login attempt: "${emailTrimmed}"`);
  const user = await db.get('SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND password = ?', [emailTrimmed, passwordTrimmed]);
  
  if (user) {
    console.log(`Login success for: ${emailTrimmed}`);
    res.json({ success: true, user: { email: user.email, name: user.name, id: user.collab_id } });
  } else {
    console.log(`Login failed for: ${emailTrimmed}`);
    res.status(401).json({ success: false, message: 'Credenciais inválidas' });
  }
});

app.post('/api/upload', upload.single('report'), (req, res) => {
  // Simulate PDF/Excel parsing and skill extraction
  setTimeout(() => {
    res.json({
      success: true,
      extractedSkills: ["Aprendizado de Máquina", "Planejamento Estratégico", "Oratória"],
      message: "Relatório processado com sucesso. 3 novas competências identificadas."
    });
  }, 1500);
});

app.listen(port, () => {
  console.log(`PDI Hub Backend running at http://localhost:${port}`);
});
