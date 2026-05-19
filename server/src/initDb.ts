import { getDb, initSchema } from './db';
import * as xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';

async function importCsv() {
  await initSchema();
  const db = await getDb();
  
  const rootDir = path.join(process.cwd(), '..');
  const serverDataDir = path.join(process.cwd(), 'data');

  // Load CSVs
  const collabFile = xlsx.readFile(path.join(rootDir, 'colaboradores.csv'));
  const pdiFile = xlsx.readFile(path.join(rootDir, 'pdi_respostas.csv'));
  const evalFile = xlsx.readFile(path.join(serverDataDir, 'avaliacoes_gestor.csv'));

  const collaborators: any[] = xlsx.utils.sheet_to_json(collabFile.Sheets[collabFile.SheetNames[0]!], { defval: "" });
  const pdiResponses: any[] = xlsx.utils.sheet_to_json(pdiFile.Sheets[pdiFile.SheetNames[0]!], { defval: "" });
  const managerEvals: any[] = xlsx.utils.sheet_to_json(evalFile.Sheets[evalFile.SheetNames[0]!], { defval: "" });

  console.log("Resetting database...");
  await db.run('DELETE FROM collaborators');
  await db.run('DELETE FROM pdi_responses');
  await db.run('DELETE FROM manager_evaluations');
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
      'INSERT INTO collaborators (id, nome, cargo, departamento, gestor_id, status) VALUES (?, ?, ?, ?, ?, ?)',
      [collabId, collab.nome, collab.cargo, collab.departamento, collab.gestor_id, status]
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
    await db.run(
      'INSERT INTO pdi_responses (id_colaborador, treinamento_nome, q1_conhecimento, q2_aplicacao, q3_desempenho, q4_eficacia) VALUES (?, ?, ?, ?, ?, ?)',
      [String(pdi.id_colaborador), pdi.treinamento_nome, pdi.q1_conhecimento, pdi.q2_aplicacao, pdi.q3_desempenho, pdi.q4_eficacia]
    );
  }

  console.log("Importing manager evaluations...");
  for (const evaluation of managerEvals) {
    await db.run(
      'INSERT INTO manager_evaluations (id_colaborador, comentarios_soft_skills, avaliacao_pessoal_texto, data) VALUES (?, ?, ?, ?)',
      [String(evaluation.id_colaborador), evaluation.comentarios_soft_skills, evaluation.avaliacao_pessoal_texto, evaluation.data]
    );
  }

  console.log("SUCCESS: Database fully synchronized with real data.");
}

importCsv().catch(console.error);
