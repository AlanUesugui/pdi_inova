import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

class PostgresDb {
  private pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not defined in environment variables.");
    }
    this.pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
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
    
    // Append RETURNING id only for tables that have an 'id' column and need lastID
    const isInsertWithLastId = /^\s*insert\s+into\s+(feedbacks|meetings)\b/i.test(pgSql);
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
      lastID,
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

let dbInstance: PostgresDb | null = null;

export async function getDb() {
  if (!dbInstance) {
    dbInstance = new PostgresDb();
  }
  return dbInstance;
}

export async function initSchema() {
  const db = await getDb();
  
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
      tipo_contrato TEXT
    );

    CREATE TABLE IF NOT EXISTS pdi_responses (
      id SERIAL PRIMARY KEY,
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

    CREATE TABLE IF NOT EXISTS feedbacks (
      id SERIAL PRIMARY KEY,
      id_colaborador TEXT,
      gestor_id TEXT,
      tipo TEXT,
      conteudo TEXT,
      data TEXT,
      FOREIGN KEY(id_colaborador) REFERENCES collaborators(id)
    );

    CREATE TABLE IF NOT EXISTS meetings (
      id SERIAL PRIMARY KEY,
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
  `);
}
