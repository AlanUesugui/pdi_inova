import express from 'express';
import cors from 'cors';
import multer from 'multer';
import * as xlsx from 'xlsx';
import path from 'path';
import { runPDIAgentChain } from './agents';
import { mockTeam, calculateAIHealth } from './team';
import { processPDIData } from './dataProcessor';
import { getDb, initSchema } from './db';
import { analyzeCollaborator } from './analyzer';
import OpenAI from 'openai';

const app = express();
const port = 3001;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// Initialize DB
initSchema().then(() => console.log("Database Schema Ready"));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/analyze', async (req, res) => {
  const { managerId } = req.body;
  const db = await getDb();

  try {
    if (!managerId) {
      return res.status(400).json({ error: "managerId is required" });
    }

    // 1. Fetch team members
    const collaborators = await db.all('SELECT * FROM collaborators WHERE gestor_id = ? AND LOWER(cargo) NOT LIKE "%gestor%"', [managerId]);
    if (collaborators.length === 0) {
      return res.json({ insight: "Seu time ainda não possui colaboradores liderados cadastrados para geração de insights de PDI." });
    }

    // 2. Fetch PDI progress
    const pdis = await db.all('SELECT * FROM pdis WHERE id_colaborador IN (SELECT id FROM collaborators WHERE gestor_id = ?)', [managerId]);
    const avgProgress = pdis.length > 0
      ? Math.round(pdis.reduce((acc, curr) => acc + (parseFloat(curr.percentual_conclusao) || 0), 0) / pdis.length)
      : 72;

    // 3. Fetch training responses
    const responses = await db.all('SELECT * FROM pdi_responses WHERE id_colaborador IN (SELECT id FROM collaborators WHERE gestor_id = ?)', [managerId]);

    // Find highlights and attention points
    const sortedCollabs = [...collaborators].map(c => {
      const cPdis = pdis.filter(p => String(p.id_colaborador) === String(c.id));
      const progress = cPdis.length > 0 ? Math.round(cPdis.reduce((a, curr) => a + (parseFloat(curr.percentual_conclusao) || 0), 0) / cPdis.length) : 50;
      return { ...c, progress };
    }).sort((a, b) => a.progress - b.progress);

    const lowest = sortedCollabs[0];
    const highest = sortedCollabs[sortedCollabs.length - 1];

    const details = sortedCollabs.map(c => `- ${c.nome} (${c.cargo}): Progresso de PDI em ${c.progress}%`).join('\n');

    const prompt = `Você é um consultor estratégico de RH e IA. Faça uma análise crítica e traga um insight geral de 3 a 4 sentenças sobre o andamento dos PDIs (Planos de Desenvolvimento Individual) e treinamentos do time deste gestor.
  
Dados do Time:
- Total de Liderados: ${collaborators.length}
- Progresso Médio de PDI: ${avgProgress}%
- Colaboradores e seus PDIs:
${details}
  
Diretriz: Gere um insight profissional, direto, encorajador e acionável sobre o status geral do PDI do time, destacando pontos de atenção (como colaboradores com baixo progresso ou treinamentos ineficazes) e recomendações práticas para o gestor. Retorne no formato JSON: { "insight": "texto do insight aqui" }`;

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

    return res.json(JSON.parse(aiResult));
  } catch (error) {
    // Dynamic fallback generation based on real data
    try {
      const collaborators = await db.all('SELECT * FROM collaborators WHERE gestor_id = ? AND LOWER(cargo) NOT LIKE "%gestor%"', [managerId]);
      const pdis = await db.all('SELECT * FROM pdis WHERE id_colaborador IN (SELECT id FROM collaborators WHERE gestor_id = ?)', [managerId]);
      const avgProgress = pdis.length > 0
        ? Math.round(pdis.reduce((acc, curr) => acc + (parseFloat(curr.percentual_conclusao) || 0), 0) / pdis.length)
        : 72;

      const sortedCollabs = [...collaborators].map(c => {
        const cPdis = pdis.filter(p => String(p.id_colaborador) === String(c.id));
        const progress = cPdis.length > 0 ? Math.round(cPdis.reduce((a, curr) => a + (parseFloat(curr.percentual_conclusao) || 0), 0) / cPdis.length) : 50;
        return { ...c, progress };
      }).sort((a, b) => a.progress - b.progress);

      const lowest = sortedCollabs[0];
      const highest = sortedCollabs[sortedCollabs.length - 1];

      let fallbackText = `Seu time apresenta um progresso médio de PDI consolidado de ${avgProgress}%. `;
      if (highest && highest.progress >= 80) {
        fallbackText += `Colaboradores como ${highest.nome} lideram a evolução com ${highest.progress}% de conclusão nas suas metas. `;
      }
      if (lowest && lowest.progress < 60) {
        fallbackText += `Contudo, recomenda-se atenção especial a ${lowest.nome} (${lowest.cargo}), que possui o menor progresso (${lowest.progress}%) e precisa de uma sessão de feedback estruturado para remover barreiras no plano de desenvolvimento.`;
      } else {
        fallbackText += `A maioria dos colaboradores apresenta bom engajamento e as metas do ciclo atual estão caminhando no ritmo planejado.`;
      }

      res.json({ insight: fallbackText });
    } catch (fallbackError) {
      res.json({ insight: "Seu time de Operações apresenta boa consistência geral com 72% de progresso médio nos PDIs cadastrados." });
    }
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

app.get('/api/dashboard-stats', async (req, res) => {
  const { managerId } = req.query;
  if (!managerId) {
    res.status(400).json({ error: "managerId is required" });
    return;
  }

  try {
    const db = await getDb();

    // 1. Team Size (only active members, i.e. excluding manager themselves if role includes gestor)
    const collaborators = await db.all('SELECT * FROM collaborators WHERE gestor_id = ? AND LOWER(cargo) NOT LIKE "%gestor%"', [managerId]);
    const activeMembersCount = collaborators.length;

    // 2. Skills Mapeados (distinct competencies expected for the team roles)
    let mappedSkillsCount = 0;
    try {
      const rootDir = path.join(process.cwd(), '..');
      const compFile = xlsx.readFile(path.join(rootDir, 'competencias_por_cargo.csv'));
      const competencies: any[] = xlsx.utils.sheet_to_json(compFile.Sheets[compFile.SheetNames[0]!] as xlsx.WorkSheet, { defval: "" });

      const teamRoles = collaborators.map(c => c.cargo.toLowerCase());
      const uniqueCompetencies = new Set(
        competencies
          .filter(c => teamRoles.includes(c.cargo.toLowerCase()))
          .map(c => c.competencia.toLowerCase())
      );
      mappedSkillsCount = uniqueCompetencies.size || 148;
    } catch (e) {
      mappedSkillsCount = 148;
    }

    // 3. Average PDI Progress
    const pdis = await db.all('SELECT percentual_conclusao FROM pdis WHERE gestor_responsavel = ?', [managerId]);
    const averagePDIProgress = pdis.length > 0
      ? Math.round(pdis.reduce((acc, curr) => acc + (parseFloat(curr.percentual_conclusao) || 0), 0) / pdis.length)
      : 72;

    // 4. eNPS, Mood Average, Retention Rate from manager evaluations
    const evals = await db.all('SELECT * FROM manager_evaluations WHERE id_colaborador IN (SELECT id FROM collaborators WHERE gestor_id = ?)', [managerId]);

    const ratings = evals.map(e => parseFloat(e.nota_desempenho_geral)).filter(n => !isNaN(n));
    const moodAvg = ratings.length > 0
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : "4.2";

    const promoters = evals.filter(e => e.potencial_crescimento === 'Alto').length;
    const detractors = evals.filter(e => e.potencial_crescimento === 'Baixo').length;
    const eNPS = evals.length > 0
      ? Math.round(((promoters - detractors) / evals.length) * 100)
      : 78;

    const retentionRate = evals.length > 0
      ? Math.round((evals.filter(e => e.potencial_crescimento !== 'Baixo').length / evals.length) * 100)
      : 96;

    // 5. Training Modalites Completion Rates (from pdi_responses)
    const responses = await db.all('SELECT * FROM pdi_responses WHERE id_colaborador IN (SELECT id FROM collaborators WHERE gestor_id = ?)', [managerId]);

    const calculateModalityRate = (names: string[], defaultRate: number) => {
      const filtered = responses.filter(r => names.some(name => r.treinamento_nome.toLowerCase().includes(name)));
      if (filtered.length === 0) return defaultRate;
      return Math.round((filtered.filter(f => f.q4_eficacia === 'Sim').length / filtered.length) * 100);
    };

    const workshopsRate = calculateModalityRate(['excel', 'inteligência', 'power bi'], 88);
    const mentoringRate = calculateModalityRate(['feedback', 'liderança', 'tempo'], 64);
    const coursesRate = calculateModalityRate(['segurança', 'comunicação', 'dados'], 42);
    const certsRate = calculateModalityRate(['projetos', 'gestão'], 91);

    res.json({
      activeMembersCount,
      mappedSkillsCount,
      averagePDIProgress,
      eNPS,
      moodAvg,
      retentionRate,
      workshopsRate,
      mentoringRate,
      coursesRate,
      certsRate
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/pdi-stats', (req, res) => {
  try {
    const data = processPDIData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/roles', (req, res) => {
  try {
    const rootDir = path.join(process.cwd(), '..');
    const compFile = xlsx.readFile(path.join(rootDir, 'competencias_por_cargo.csv'));
    const competencies: any[] = xlsx.utils.sheet_to_json(compFile.Sheets[compFile.SheetNames[0]!] as xlsx.WorkSheet, { defval: "" });

    const rolesMap: { [key: string]: any } = {};
    competencies.forEach(c => {
      const roleName = c.cargo.trim();
      if (!roleName) return;
      if (!rolesMap[roleName]) {
        rolesMap[roleName] = {
          name: roleName,
          competencies: []
        };
      }
      rolesMap[roleName].competencies.push({
        competencia: c.competencia,
        tipo: c.tipo,
        nivel_necessario: c.nivel_necessario,
        descricao: c.descricao_competencia || ""
      });
    });

    res.json(Object.values(rolesMap));
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/career-map', async (req, res) => {
  const { managerId } = req.query;
  try {
    const db = await getDb();
    const rootDir = path.join(process.cwd(), '..');

    let query = 'SELECT * FROM collaborators WHERE LOWER(cargo) NOT LIKE "%gestor%"';
    const params: any[] = [];
    if (managerId) {
      query += ' AND gestor_id = ?';
      params.push(managerId);
    }
    const collaborators = await db.all(query, params);
    const pdiResponses = await db.all('SELECT * FROM pdi_responses');

    let curriculos: any[] = [];
    try {
      const f = xlsx.readFile(path.join(rootDir, 'curriculos.xlsx'));
      curriculos = xlsx.utils.sheet_to_json(f.Sheets[f.SheetNames[0]!] as xlsx.WorkSheet, { defval: '' });
    } catch (_) { }

    let avaliacoes: any[] = [];
    try {
      const f = xlsx.readFile(path.join(rootDir, 'avaliacoes_gestor.xlsx'));
      avaliacoes = xlsx.utils.sheet_to_json(f.Sheets[f.SheetNames[0]!] as xlsx.WorkSheet, { defval: '' });
    } catch (_) { }

    let competencias: any[] = [];
    try {
      const f = xlsx.readFile(path.join(rootDir, 'competencias_por_cargo.csv'));
      competencias = xlsx.utils.sheet_to_json(f.Sheets[f.SheetNames[0]!] as xlsx.WorkSheet, { defval: '' });
    } catch (_) { }

    const result = collaborators.map(c => {
      const cv = curriculos.find((r: any) => String(r.id) === String(c.id)) || {};
      const av = avaliacoes.find((r: any) => String(r['ID']) === String(c.id)) || {};
      const trainings = pdiResponses.filter(p => String(p.id_colaborador) === String(c.id));
      const reqComps = competencias.filter((r: any) =>
        r.cargo?.toLowerCase().trim() === c.cargo?.toLowerCase().trim()
      );

      return {
        id: String(c.id),
        nome: c.nome,
        cargo: c.cargo,
        departamento: c.departamento,
        nivel_cargo: c.nivel_cargo || '',
        data_admissao: c.data_admissao || '',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nome)}&background=random&color=fff`,
        nivel_escolaridade: cv.nivel_escolaridade || '',
        curso_formacao: cv.curso_formacao || '',
        instituicao: cv.instituicao || '',
        idioma: cv.idioma || '',
        nivel_idioma: cv.nivel_idioma || '',
        anos_experiencia: cv.anos_experiencia || 0,
        competencia_tecnica_1: cv.competencia_tecnica_1 || '',
        competencia_tecnica_2: cv.competencia_tecnica_2 || '',
        competencia_tecnica_3: cv.competencia_tecnica_3 || '',
        competencia_comportamental: cv.competencia_comportamental || '',
        competencia_comportamental_2: cv.competencia_comportamental_2 || '',
        certificacoes: cv.certificacoes || '',
        fit_cultural: av['01. Fit Cultural'] || '',
        mapa_sucessao: av['02. Mapa de Sucessão'] || '',
        nivel_prontidao: av['03. Nível de Prontidão'] || '',
        risco_perda: av['04. Risco de Perda'] || '',
        impacto_saida: av['05. Impacto de Saída'] || '',
        designacao_sucessao: av['06. Designação de Sucessão'] || '',
        potencial_crescimento: av.potencial_crescimento || '',
        nota_desempenho: av.nota_desempenho_geral || '',
        comentarios_gestor: av.comentarios_gestor || '',
        treinamentos: trainings.map(t => ({
          nome: t.treinamento_nome,
          conhecimento: t.q1_conhecimento,
          aplicacao: t.q2_aplicacao,
          desempenho: t.q3_desempenho,
          eficacia: t.q4_eficacia,
          data: t.data_resposta || '',
          carga_horaria: t.carga_horaria || '',
          provedor: t.provedor_treinamento || '',
        })),
        competencias_exigidas: reqComps.map((r: any) => ({
          competencia: r.competencia,
          tipo: r.tipo,
          nivel: r.nivel_necessario,
        })),
      };
    });

    res.json(result);
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

// Feedbacks Endpoints
app.get('/api/feedbacks', async (req, res) => {
  const { collabId, managerId } = req.query;
  const db = await getDb();
  try {
    let query = 'SELECT * FROM feedbacks';
    const params: any[] = [];
    const conditions: string[] = [];

    if (collabId) {
      conditions.push('id_colaborador = ?');
      params.push(collabId);
    }
    if (managerId) {
      conditions.push('gestor_id = ?');
      params.push(managerId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY data DESC';

    const feedbacks = await db.all(query, params);
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/feedbacks', async (req, res) => {
  const { id_colaborador, gestor_id, tipo, conteudo } = req.body;
  const db = await getDb();
  try {
    if (!id_colaborador || !gestor_id || !tipo || !conteudo) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const data = new Date().toISOString();
    const result = await db.run(
      'INSERT INTO feedbacks (id_colaborador, gestor_id, tipo, conteudo, data) VALUES (?, ?, ?, ?, ?)',
      [id_colaborador, gestor_id, tipo, conteudo, data]
    );

    // Also update manager_evaluations count of feedbacks given
    await db.run(
      `INSERT INTO manager_evaluations (id_colaborador, numero_de_feedbacks_dados) 
       VALUES (?, 1) 
       ON CONFLICT(id_colaborador) DO UPDATE SET 
       numero_de_feedbacks_dados = COALESCE(numero_de_feedbacks_dados, 0) + 1`,
      [id_colaborador]
    );

    res.json({ success: true, id: result.lastID, data });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// --- Meetings Endpoints ---
app.get('/api/meetings', async (req, res) => {
  const { collabId, managerId } = req.query;
  const db = await getDb();
  try {
    let query = 'SELECT * FROM meetings';
    const params: any[] = [];
    const conditions: string[] = [];

    if (collabId) {
      conditions.push('id_colaborador = ?');
      params.push(collabId);
    }
    if (managerId) {
      conditions.push('gestor_id = ?');
      params.push(managerId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY data ASC, hora ASC';

    const meetings = await db.all(query, params);
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/meetings', async (req, res) => {
  const { id_colaborador, gestor_id, data, hora, tipo, observacoes, link } = req.body;
  const db = await getDb();
  try {
    if (!id_colaborador || !gestor_id || !data || !hora || !tipo) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const meetingLink = link || `https://meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
    const result = await db.run(
      'INSERT INTO meetings (id_colaborador, gestor_id, data, hora, tipo, status, link, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id_colaborador, gestor_id, data, hora, tipo, 'Agendado', meetingLink, observacoes || '']
    );

    // Also update manager_evaluations with last 1:1 date if the scheduled date is soon or if we want to record it
    if (tipo === '1:1') {
      await db.run(
        `INSERT INTO manager_evaluations (id_colaborador, data_ultima_conversa_1_1) 
         VALUES (?, ?) 
         ON CONFLICT(id_colaborador) DO UPDATE SET 
         data_ultima_conversa_1_1 = ?`,
        [id_colaborador, data, data]
      );
    }

    res.json({ success: true, id: result.lastID, link: meetingLink });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.patch('/api/meetings/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'Realizado' or 'Cancelado'
  const db = await getDb();
  try {
    if (!status) {
      res.status(400).json({ error: "Status is required" });
      return;
    }
    await db.run(
      'UPDATE meetings SET status = ? WHERE id = ?',
      [status, id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
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
