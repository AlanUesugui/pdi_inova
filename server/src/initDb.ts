import { getDb, initSchema } from './db';
import * as xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import * as csv from 'csv-parse/sync';

async function importCsv() {
  await initSchema();
  const db = await getDb();
  
  const rootDir = path.join(process.cwd(), '..');
  const serverDataDir = path.join(process.cwd(), 'data');

  // Load CSVs
  const collaborators: any[] = csv.parse(fs.readFileSync(path.join(rootDir, 'colaboradores.csv'), 'utf-8').replace(/\r/g, ''), { columns: true, skip_empty_lines: true });
  const pdiResponses: any[] = csv.parse(fs.readFileSync(path.join(rootDir, 'pdi_respostas.csv'), 'utf-8').replace(/\r/g, ''), { columns: true, skip_empty_lines: true });
  const managerEvals: any[] = csv.parse(fs.readFileSync(path.join(serverDataDir, 'avaliacoes_gestor.csv'), 'utf-8').replace(/\r/g, ''), { columns: true, skip_empty_lines: true });
  const pdisData: any[] = csv.parse(fs.readFileSync(path.join(rootDir, 'pdis.csv'), 'utf-8').replace(/\r/g, ''), { columns: true, skip_empty_lines: true });

  console.log("Resetting database...");
  await db.run('DELETE FROM collaborators');
  await db.run('DELETE FROM pdi_responses');
  await db.run('DELETE FROM manager_evaluations');
  await db.run('DELETE FROM pdis');
  await db.run('DELETE FROM users');

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
      'INSERT INTO collaborators (id, nome, cargo, departamento, gestor_id, status, data_admissao, modalidade_trabalho, email, nivel_cargo, centro_de_custo, tipo_contrato) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        collabId, collab.nome, collab.cargo, collab.departamento, collab.gestor_id, status,
        collab.data_admissao || "", collab.modalidade_trabalho || "", collab.email || "",
        collab.nivel_cargo || "", collab.centro_de_custo || "", collab.tipo_contrato || ""
      ]
    );

    if (isManager) {
      // Create user login
      const cleanName = collab.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); 
      const email = `${cleanName.split(' ')[0].toLowerCase()}@pdi.com`.trim();
      await db.run(
        'INSERT OR REPLACE INTO users (email, password, name, collab_id) VALUES (?, ?, ?, ?)',
        [email, '123456', collab.nome.trim(), collabId]
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

  console.log("SUCCESS: Database fully synchronized with real data.");
}

importCsv().catch(console.error);
