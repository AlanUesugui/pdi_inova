import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export async function getDb() {
  if (db) return db;
  
  db = await open({
    filename: path.join(process.cwd(), 'database.sqlite'),
    driver: sqlite3.Database
  });
  
  return db;
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
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  `);
}
