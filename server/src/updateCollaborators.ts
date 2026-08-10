import { getDb, initSchema } from './db';
import path from 'path';
import fs from 'fs';
import * as csv from 'csv-parse/sync';

async function updateCollaborators() {
  console.log("Iniciando verificação do schema...");
  await initSchema();
  const db = await getDb();
  
  const rootDir = path.join(process.cwd(), '..');
  const csvPath = path.join(rootDir, 'colaboradores.csv');

  console.log(`Lendo dados de: ${csvPath}`);
  if (!fs.existsSync(csvPath)) {
    throw new Error(`Arquivo não encontrado em: ${csvPath}`);
  }

  const rawCsv = fs.readFileSync(csvPath, 'utf-8').replace(/^\uFEFF/, '').replace(/\r/g, '');
  const collaborators: any[] = csv.parse(rawCsv, { columns: true, skip_empty_lines: true, trim: true });

  const managerIds = new Set(collaborators.map(c => String(c.gestor_id)).filter(id => id && id !== '0' && id !== ''));

  let updatedCount = 0;
  let createdCount = 0;

  // Check existing IDs in DB
  const existingRows = await db.all('SELECT id FROM collaborators');
  const existingIds = new Set(existingRows.map(r => String(r.id)));

  console.log(`Encontrados ${collaborators.length} registros no CSV. Registros existentes no banco: ${existingIds.size}`);

  for (const collab of collaborators) {
    const collabId = String(collab.id).trim();
    if (!collabId) continue;

    const isManager = !collab.gestor_id || collab.gestor_id === "0" || managerIds.has(collabId) || (collab.cargo && collab.cargo.toLowerCase().includes('gestor'));
    const status = isManager ? 'Gestor' : 'Colaborador';
    const superiorImediato = collab.superior_imediato ? String(collab.superior_imediato).trim() : null;

    if (existingIds.has(collabId)) {
      await db.run(
        `UPDATE collaborators SET
           nome = ?,
           cargo = ?,
           departamento = ?,
           gestor_id = ?,
           status = ?,
           data_admissao = ?,
           modalidade_trabalho = ?,
           email = ?,
           nivel_cargo = ?,
           centro_de_custo = ?,
           tipo_contrato = ?,
           superior_imediato = ?
         WHERE id = ?`,
        [
          collab.nome || '', collab.cargo || '', collab.departamento || '', collab.gestor_id || '', status,
          collab.data_admissao || '', collab.modalidade_trabalho || '', collab.email || '',
          collab.nivel_cargo || '', collab.centro_de_custo || '', collab.tipo_contrato || '',
          superiorImediato,
          collabId
        ]
      );
      updatedCount++;
    } else {
      await db.run(
        `INSERT INTO collaborators (id, nome, cargo, departamento, gestor_id, status, data_admissao, modalidade_trabalho, email, nivel_cargo, centro_de_custo, tipo_contrato, superior_imediato)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          collabId, collab.nome || '', collab.cargo || '', collab.departamento || '', collab.gestor_id || '', status,
          collab.data_admissao || '', collab.modalidade_trabalho || '', collab.email || '',
          collab.nivel_cargo || '', collab.centro_de_custo || '', collab.tipo_contrato || '',
          superiorImediato
        ]
      );
      createdCount++;
    }

    if (isManager && collab.nome) {
      const cleanName = collab.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); 
      const email = `${cleanName.split(' ')[0].toLowerCase()}@pdi.com`.trim();
      await db.run(
        'INSERT INTO users (email, password, name, collab_id) VALUES (?, ?, ?, ?) ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name, collab_id = EXCLUDED.collab_id',
        [email, '123456', collab.nome.trim(), collabId]
      );
    }
  }

  const sampleRows = await db.all('SELECT id, nome, gestor_id, superior_imediato FROM collaborators WHERE superior_imediato IS NOT NULL AND superior_imediato != \'\' ORDER BY id LIMIT 10');
  const countWithSuperior = await db.all('SELECT COUNT(*) as count FROM collaborators WHERE superior_imediato IS NOT NULL AND superior_imediato != \'\'');
  const totalCount = await db.all('SELECT COUNT(*) as count FROM collaborators');

  console.log("-----------------------------------------");
  console.log(`SUCESSO: Sincronização concluída.`);
  console.log(`Registros no CSV: ${collaborators.length}`);
  console.log(`Registros atualizados: ${updatedCount}`);
  console.log(`Registros criados: ${createdCount}`);
  console.log(`Total de colaboradores no banco: ${totalCount[0]?.count}`);
  console.log(`Total com superior_imediato preenchido: ${countWithSuperior[0]?.count}`);
  console.log("Amostra de colaboradores com superior_imediato:");
  console.table(sampleRows);
  console.log("-----------------------------------------");

  await db.close();
}

updateCollaborators().catch(err => {
  console.error("Erro ao atualizar colaboradores:", err);
  process.exit(1);
});
