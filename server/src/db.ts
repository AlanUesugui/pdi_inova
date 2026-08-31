import { Pool } from 'pg';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';
import * as csv from 'csv-parse/sync';

dotenv.config();

export interface IDb {
  all(sql: string, params?: any[]): Promise<any[]>;
  get(sql: string, params?: any[]): Promise<any | undefined>;
  run(sql: string, params?: any[]): Promise<{ lastID?: number | string | undefined; changes: number }>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
  isSqlite?: boolean;
}

<<<<<<< HEAD
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not defined in environment variables.");
    }
    const isLocal = connectionString.includes('localhost') ||
      connectionString.includes('127.0.0.1') ||
      connectionString.includes('postgres:5432') ||
      process.env.DB_SSL === 'false';

    this.pool = new Pool({
      connectionString,
      ssl: isLocal ? false : { rejectUnauthorized: false }
=======
class PostgresDb implements IDb {
  private pool: Pool;
  public isSqlite = false;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 5000
>>>>>>> 3b10e33 (Atualiza projeto)
    });
  }

  private convertSql(sql: string): string {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    const pgSql = this.convertSql(sql);
    const result = await this.pool.query(pgSql, params);
    return result.rows;
  }

  async get(sql: string, params: any[] = []): Promise<any | undefined> {
    const pgSql = this.convertSql(sql);
    const result = await this.pool.query(pgSql, params);
    return result.rows[0];
  }

  async run(sql: string, params: any[] = []): Promise<{ lastID?: number | string; changes: number }> {
    let pgSql = this.convertSql(sql);
<<<<<<< HEAD

    // Append RETURNING id only for tables that have an 'id' column and need lastID
    const isInsertWithLastId = /^\s*insert\s+into\s+(feedbacks|meetings|weekly_report_log)\b/i.test(pgSql);
=======
    
    const isInsertWithLastId = /^\s*insert\s+into\s+(feedbacks|meetings)\b/i.test(pgSql);
>>>>>>> 3b10e33 (Atualiza projeto)
    const hasReturning = /returning/i.test(pgSql);

    if (isInsertWithLastId && !hasReturning) {
      pgSql += ' RETURNING id';
    }

    const result = await this.pool.query(pgSql, params);

    let lastID: any = undefined;
    if (isInsertWithLastId && result.rows && result.rows.length > 0) {
      lastID = result.rows[0].id;
    }

    return {
      ...(lastID !== undefined ? { lastID } : {}),
      changes: result.rowCount || 0
    };
  }

  async exec(sql: string): Promise<void> {
    await this.pool.query(sql);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

class SqliteDb implements IDb {
  private db: Database;
  public isSqlite = true;

  constructor(db: Database) {
    this.db = db;
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    return await this.db.all(sql, params);
  }

  async get(sql: string, params: any[] = []): Promise<any | undefined> {
    return await this.db.get(sql, params);
  }

  async run(sql: string, params: any[] = []): Promise<{ lastID?: number | string; changes: number }> {
    const result = await this.db.run(sql, params);
    return {
      ...(result.lastID !== undefined ? { lastID: result.lastID } : {}),
      changes: result.changes || 0
    };
  }

  async exec(sql: string): Promise<void> {
    await this.db.exec(sql);
  }

  async close(): Promise<void> {
    await this.db.close();
  }
}

let dbInstance: IDb | null = null;

export async function getDb(): Promise<IDb> {
  if (dbInstance) {
    return dbInstance;
  }

  const connectionString = process.env.DATABASE_URL;

  if (connectionString) {
    try {
      const pgDb = new PostgresDb(connectionString);
      // Quick test query to verify PostgreSQL connectivity
      await pgDb.all('SELECT 1');
      console.log("Connected successfully to PostgreSQL database.");
      dbInstance = pgDb;
      return dbInstance;
    } catch (err: any) {
      console.warn(`⚠️ PostgreSQL connection error (${err.message}). Falling back to local SQLite database...`);
    }
  } else {
    console.log("No DATABASE_URL found. Initializing local SQLite database...");
  }

  // Fallback to SQLite
  const dbPath = path.join(process.cwd(), 'pdi_hub.db');
  const sqliteConnection = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  await sqliteConnection.exec('PRAGMA foreign_keys = ON;');
  
  dbInstance = new SqliteDb(sqliteConnection);
  console.log(`Local SQLite database active at: ${dbPath}`);
  return dbInstance;
}

export async function seedDatabase(db: IDb): Promise<void> {
  const rootDir = path.join(process.cwd(), '..');
  const serverDataDir = path.join(process.cwd(), 'data');

  const collabCsvPath = path.join(rootDir, 'colaboradores.csv');
  const pdiCsvPath = path.join(rootDir, 'pdi_respostas.csv');
  const evalCsvPath = path.join(serverDataDir, 'avaliacoes_gestor.csv');
  const pdisCsvPath = path.join(rootDir, 'pdis.csv');

  if (!fs.existsSync(collabCsvPath)) {
    console.warn("CSV seed files not found. Skipping auto-seed.");
    return;
  }

  console.log("Seeding database with CSV data...");
  const readCsv = (p: string) => {
    const raw = fs.readFileSync(p, 'utf-8').replace(/^\uFEFF/, '').replace(/\r/g, '');
    return csv.parse(raw, { columns: true, skip_empty_lines: true, trim: true });
  };

  const collaborators: any[] = readCsv(collabCsvPath);
  const pdiResponses: any[] = readCsv(pdiCsvPath);
  const managerEvals: any[] = readCsv(evalCsvPath);
  const pdisData: any[] = readCsv(pdisCsvPath);

  if (db.isSqlite) {
    await db.exec('PRAGMA foreign_keys = OFF;');
  }
  await db.run('DELETE FROM pdi_responses');
  await db.run('DELETE FROM manager_evaluations');
  await db.run('DELETE FROM pdis');
  await db.run('DELETE FROM users');
  await db.run('DELETE FROM feedbacks');
  await db.run('DELETE FROM meetings');
  await db.run('DELETE FROM collaborators');
  if (db.isSqlite) {
    await db.exec('PRAGMA foreign_keys = ON;');
  }

  const managerIds = new Set(collaborators.map(c => String(c.gestor_id)).filter(id => id && id !== '0' && id !== ''));

  for (const collab of collaborators) {
    const collabId = String(collab.id);
    if (!collabId) continue;

    const isManager = !collab.gestor_id || collab.gestor_id === "0" || managerIds.has(collabId) || (collab.cargo && collab.cargo.toLowerCase().includes('gestor'));
    const status = isManager ? 'Gestor' : 'Colaborador';

    await db.run(
      'INSERT INTO collaborators (id, nome, cargo, departamento, gestor_id, status, data_admissao, modalidade_trabalho, email, nivel_cargo, centro_de_custo, tipo_contrato, superior_imediato) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO UPDATE SET superior_imediato = EXCLUDED.superior_imediato, gestor_id = EXCLUDED.gestor_id',
      [
        collabId, collab.nome || '', collab.cargo || '', collab.departamento || '', collab.gestor_id || '', status,
        collab.data_admissao || "", collab.modalidade_trabalho || "", collab.email || "",
        collab.nivel_cargo || "", collab.centro_de_custo || "", collab.tipo_contrato || "",
        collab.superior_imediato || null
      ]
    );

    if (isManager && collab.nome) {
      const cleanName = collab.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); 
      const email = `${cleanName.split(' ')[0].toLowerCase()}@pdi.com`.trim();
      await db.run(
        'INSERT INTO users (email, password, name, collab_id) VALUES (?, ?, ?, ?) ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name, collab_id = EXCLUDED.collab_id',
        [email, '123456', collab.nome.trim(), collabId]
      );
    }
  }

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

  console.log("✅ Database successfully seeded!");
}

export async function initSchema() {
  const db = await getDb();
<<<<<<< HEAD
=======
  
  const idType = db.isSqlite ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'SERIAL PRIMARY KEY';
>>>>>>> 3b10e33 (Atualiza projeto)

  await db.exec(`
    CREATE TABLE IF NOT EXISTS collaborators (
      id TEXT PRIMARY KEY,
      nome TEXT,
      cargo TEXT,
      departamento TEXT,
      gestor_id TEXT,
      status TEXT,
      data_admissao TEXT,
      modalidade_trabalho TEXT,
      email TEXT,
      nivel_cargo TEXT,
      centro_de_custo TEXT,
      tipo_contrato TEXT,
      superior_imediato TEXT
    );

    CREATE TABLE IF NOT EXISTS pdi_responses (
      id ${idType},
      id_colaborador TEXT,
      treinamento_nome TEXT,
      q1_conhecimento TEXT,
      q2_aplicacao TEXT,
      q3_desempenho TEXT,
      q4_eficacia TEXT,
      data_resposta TEXT,
      modalidade_treinamento TEXT,
      carga_horaria TEXT,
      provedor_treinamento TEXT,
      custo_treinamento TEXT,
      competencia_desenvolvida TEXT,
      q5_recomendaria TEXT,
      nota_geral_treinamento TEXT,
      aplicou_no_trabalho TEXT,
      FOREIGN KEY(id_colaborador) REFERENCES collaborators(id)
    );

    CREATE TABLE IF NOT EXISTS manager_evaluations (
      id_colaborador TEXT PRIMARY KEY,
      comentarios_soft_skills TEXT,
      avaliacao_pessoal_texto TEXT,
      data TEXT,
      data_avaliacao TEXT,
      periodo_referencia TEXT,
      nota_desempenho_geral TEXT,
      potencial_crescimento TEXT,
      comentarios_gestor TEXT,
      metas_atingidas TEXT,
      numero_de_feedbacks_dados TEXT,
      colaborador_tem_pdi_ativo TEXT,
      data_ultima_conversa_1_1 TEXT,
      FOREIGN KEY(id_colaborador) REFERENCES collaborators(id)
    );

    CREATE TABLE IF NOT EXISTS pdis (
      id_pdi TEXT PRIMARY KEY,
      id_colaborador TEXT,
      data_criacao TEXT,
      data_prazo TEXT,
      status_pdi TEXT,
      objetivo_principal TEXT,
      gestor_responsavel TEXT,
      percentual_conclusao TEXT,
      data_ultima_revisao TEXT,
      proxima_revisao TEXT,
      FOREIGN KEY(id_colaborador) REFERENCES collaborators(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      password TEXT,
      name TEXT,
      collab_id TEXT,
      FOREIGN KEY(collab_id) REFERENCES collaborators(id)
    );

    CREATE TABLE IF NOT EXISTS outlook_tokens (
      email TEXT PRIMARY KEY,
      access_token TEXT,
      refresh_token TEXT,
      expires_at BIGINT,
      outlook_email TEXT,
      FOREIGN KEY(email) REFERENCES users(email)
    );

    CREATE TABLE IF NOT EXISTS feedbacks (
      id ${idType},
      id_colaborador TEXT,
      gestor_id TEXT,
      tipo TEXT,
      conteudo TEXT,
      data TEXT,
      FOREIGN KEY(id_colaborador) REFERENCES collaborators(id)
    );

    CREATE TABLE IF NOT EXISTS meetings (
      id ${idType},
      id_colaborador TEXT,
      gestor_id TEXT,
      data TEXT,
      hora TEXT,
      tipo TEXT,
      status TEXT DEFAULT 'Agendado',
      link TEXT,
      observacoes TEXT,
      FOREIGN KEY(id_colaborador) REFERENCES collaborators(id)
    );

    CREATE TABLE IF NOT EXISTS weekly_report_log (
      id SERIAL PRIMARY KEY,
      manager_email TEXT NOT NULL,
      manager_id TEXT,
      sent_at TEXT NOT NULL,
      issues_count INTEGER DEFAULT 0,
      collaborators_count INTEGER DEFAULT 0,
      status TEXT NOT NULL,
      error_message TEXT
    );
  `);

  if (db.isSqlite) {
    try {
      await db.exec('ALTER TABLE collaborators ADD COLUMN superior_imediato TEXT;');
    } catch (_) {
      // Column already exists
    }
  } else {
    await db.exec('ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS superior_imediato TEXT;');
  }

  // Check if database is empty and auto-seed if necessary
  try {
    const collabs = await db.all('SELECT id FROM collaborators LIMIT 1');
    if (collabs.length === 0) {
      console.log("Database is empty. Triggering automatic seed...");
      await seedDatabase(db);
    }
  } catch (err) {
    console.warn("Could not check collaborators count:", err);
  }
}

