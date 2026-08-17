import { getDb, initSchema } from './db';
import * as xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import * as csv from 'csv-parse/sync';
import bcrypt from 'bcryptjs';

function findFile(fileName: string): string {
  const possiblePaths = [
    path.join(process.cwd(), fileName),
    path.join(process.cwd(), '..', fileName),
    path.join(process.cwd(), 'data', fileName),
    path.join(__dirname, '..', 'data', fileName),
    path.join(__dirname, '..', '..', fileName),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(`Arquivo não encontrado: ${fileName}`);
}

async function importCsv() {
  await initSchema();
  const db = await getDb();

  // Load CSVs
  const collabPath = findFile('colaboradores.csv');
  const pdiRespPath = findFile('pdi_respostas.csv');
  const managerEvalsPath = findFile('avaliacoes_gestor.csv');
  const pdisPath = findFile('pdis.csv');

  const parseCsvFile = (filePath: string) => {
    const raw = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '').replace(/\r/g, '');
    return csv.parse(raw, { columns: true, skip_empty_lines: true, trim: true, bom: true });
  };

  const collaborators: any[] = parseCsvFile(collabPath);
  const pdiResponses: any[] = parseCsvFile(pdiRespPath);
  const managerEvals: any[] = parseCsvFile(managerEvalsPath);
  const pdisData: any[] = parseCsvFile(pdisPath);

  console.log("Resetting database...");
  await db.run('DELETE FROM feedbacks');
  await db.run('DELETE FROM meetings');
  await db.run('DELETE FROM pdi_responses');
  await db.run('DELETE FROM manager_evaluations');
  await db.run('DELETE FROM pdis');
  await db.run('DELETE FROM users');
  await db.run('DELETE FROM collaborators');

  // Map to identify managers
  const managerIds = new Set(collaborators.map(c => String(c.gestor_id)).filter(id => id && id !== '0' && id !== ''));

  console.log("Importing collaborators and users...");
  for (const collab of collaborators) {
    const collabId = String(collab.id);
    if (!collabId) continue;

    // Identify if they are a manager
    // A person is a manager if they have no manager, or if they have subordinates
    const isManager = !collab.gestor_id || collab.gestor_id === "0" || managerIds.has(collabId) || collab.cargo.toLowerCase().includes('gestor');
    const status = isManager ? 'Gestor' : 'Colaborador';

    await db.run(
      'INSERT INTO collaborators (id, nome, cargo, departamento, gestor_id, status, data_admissao, modalidade_trabalho, email, nivel_cargo, centro_de_custo, tipo_contrato, superior_imediato) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO UPDATE SET superior_imediato = EXCLUDED.superior_imediato, gestor_id = EXCLUDED.gestor_id',
      [
        collabId, collab.nome, collab.cargo, collab.departamento, collab.gestor_id, status,
        collab.data_admissao || "", collab.modalidade_trabalho || "", collab.email || "",
        collab.nivel_cargo || "", collab.centro_de_custo || "", collab.tipo_contrato || "",
        collab.superior_imediato || null
      ]
    );
    if (isManager) {
      // Create user login
      const cleanName = collab.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); 
      const email = `${cleanName.split(' ')[0].toLowerCase()}@pdi.com`.trim();
      const hashedPassword = bcrypt.hashSync('123456', 10);
      await db.run(
        'INSERT INTO users (email, password, name, collab_id) VALUES (?, ?, ?, ?) ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name, collab_id = EXCLUDED.collab_id',
        [email, hashedPassword, collab.nome.trim(), collabId]
      );
      console.log(`- User created: "${email}" (ID: ${collabId})`);
    }
  }

  console.log("Importing PDI responses...");
  for (const pdi of pdiResponses) {
    if (!pdi.id_colaborador) continue;
    await db.run(
      'INSERT INTO pdi_responses (id_colaborador, treinamento_nome, q1_conhecimento, q2_aplicacao, q3_desempenho, q4_eficacia, data_resposta, modalidade_treinamento, carga_horaria, provedor_treinamento, custo_treinamento, competencia_desenvolvida, q5_recomendaria, nota_geral_treinamento, aplicou_no_trabalho) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        String(pdi.id_colaborador), pdi.treinamento_nome, pdi.q1_conhecimento, pdi.q2_aplicacao, pdi.q3_desempenho, pdi.q4_eficacia,
        pdi.data_resposta || "", pdi.modalidade_treinamento || "", pdi.carga_horaria || "",
        pdi.provedor_treinamento || "", pdi.custo_treinamento || "", pdi.competencia_desenvolvida || "",
        pdi.q5_recomendaria || "", pdi.nota_geral_treinamento || "", pdi.aplicou_no_trabalho || ""
      ]
    );
  }

  console.log("Importing manager evaluations...");
  for (const evaluation of managerEvals) {
    if (!evaluation.id_colaborador) continue;
    await db.run(
      'INSERT INTO manager_evaluations (id_colaborador, comentarios_soft_skills, avaliacao_pessoal_texto, data, data_avaliacao, periodo_referencia, nota_desempenho_geral, potencial_crescimento, comentarios_gestor, metas_atingidas, numero_de_feedbacks_dados, colaborador_tem_pdi_ativo, data_ultima_conversa_1_1) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        String(evaluation.id_colaborador), evaluation.comentarios_soft_skills, evaluation.avaliacao_pessoal_texto, evaluation.data,
        evaluation.data_avaliacao || "", evaluation.periodo_referencia || "", evaluation.nota_desempenho_geral || "",
        evaluation.potencial_crescimento || "", evaluation.comentarios_gestor || "", evaluation.metas_atingidas || "",
        evaluation.numero_de_feedbacks_dados || "", evaluation.colaborador_tem_pdi_ativo || "", evaluation.data_ultima_conversa_1_1 || ""
      ]
    );
  }

  console.log("Importing PDIs...");
  for (const pdi of pdisData) {
    if (!pdi.id_pdi) continue;
    await db.run(
      'INSERT INTO pdis (id_pdi, id_colaborador, data_criacao, data_prazo, status_pdi, objetivo_principal, gestor_responsavel, percentual_conclusao, data_ultima_revisao, proxima_revisao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        String(pdi.id_pdi), String(pdi.id_colaborador), pdi.data_criacao || "", pdi.data_prazo || "",
        pdi.status_pdi || "", pdi.objetivo_principal || "", pdi.gestor_responsavel || "",
        pdi.percentual_conclusao || "", pdi.data_ultima_revisao || "", pdi.proxima_revisao || ""
      ]
    );
  }

  console.log("Importing mock feedbacks and meetings...");
  // Mock Feedbacks
  const mockFeedbacks = [
    { id_colaborador: '11', gestor_id: '2', tipo: 'Positivo', conteudo: 'Excelente engajamento nas sessões técnicas e ótimo progresso na compreensão dos sistemas legados. Parabéns pela iniciativa de organizar a documentação!', data: '2026-06-25T14:30:00Z' },
    { id_colaborador: '11', gestor_id: '2', tipo: 'Desenvolvimento', conteudo: 'Precisamos focar um pouco mais no cumprimento dos prazos das entregas. Algumas tarefas de infraestrutura atrasaram na última sprint.', data: '2026-05-18T10:00:00Z' },
    { id_colaborador: '13', gestor_id: '2', tipo: 'Desenvolvimento', conteudo: 'Sugiro focar na melhoria de soft skills, em especial comunicação assertiva e feedback ativo para trabalhar melhor com as outras áreas.', data: '2026-06-20T16:45:00Z' },
    { id_colaborador: '13', gestor_id: '2', tipo: 'Positivo', conteudo: 'Excelente evolução técnica em SQL e modelagem de dados. As consultas construídas para os relatórios mensais estão muito otimizadas.', data: '2026-07-02T11:15:00Z' },
    { id_colaborador: '21', gestor_id: '2', tipo: 'Positivo', conteudo: 'Grande liderança informal demonstrada na facilitação dos ritos do time. Muito bom ver sua proatividade como Business Partner!', data: '2026-06-28T09:00:00Z' }
  ];

  for (const fb of mockFeedbacks) {
    await db.run(
      'INSERT INTO feedbacks (id_colaborador, gestor_id, tipo, conteudo, data) VALUES (?, ?, ?, ?, ?)',
      [fb.id_colaborador, fb.gestor_id, fb.tipo, fb.conteudo, fb.data]
    );
  }

  // Mock Meetings
  const mockMeetings = [
    { id_colaborador: '11', gestor_id: '2', data: '2026-06-25', hora: '14:00', tipo: '1:1', status: 'Realizado', link: 'https://meet.google.com/abc-defg-hij', observacoes: 'Conversa de acompanhamento sobre a integração ao time de TI. Lucas está se adaptando bem.' },
    { id_colaborador: '11', gestor_id: '2', data: '2026-07-10', hora: '10:30', tipo: 'Revisão de PDI', status: 'Agendado', link: 'https://meet.google.com/xyz-pdih-uvw', observacoes: 'Alinhamento das metas do ciclo de PDI e próximos passos.' },
    { id_colaborador: '13', gestor_id: '2', data: '2026-06-20', hora: '16:00', tipo: '1:1', status: 'Realizado', link: 'https://meet.google.com/abc-defg-hij', observacoes: 'Revisão do PDI técnico e discussão sobre soft skills.' },
    { id_colaborador: '13', gestor_id: '2', data: '2026-07-08', hora: '15:00', tipo: '1:1', status: 'Agendado', link: 'https://meet.google.com/lmn-opqr-stu', observacoes: 'Acompanhamento mensal de progresso técnico e resolução de impedimentos.' }
  ];

  for (const mt of mockMeetings) {
    await db.run(
      'INSERT INTO meetings (id_colaborador, gestor_id, data, hora, tipo, status, link, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [mt.id_colaborador, mt.gestor_id, mt.data, mt.hora, mt.tipo, mt.status, mt.link, mt.observacoes]
    );
  }

  console.log("SUCCESS: Database fully synchronized with real data and mocks.");
  await db.close();
}

importCsv().catch(err => {
  console.error(err);
  process.exit(1);
});
