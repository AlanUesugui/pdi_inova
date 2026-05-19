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
      status TEXT
    );

    CREATE TABLE IF NOT EXISTS pdi_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_colaborador TEXT,
      treinamento_nome TEXT,
      q1_conhecimento TEXT,
      q2_aplicacao TEXT,
      q3_desempenho TEXT,
      q4_eficacia TEXT,
      FOREIGN KEY(id_colaborador) REFERENCES collaborators(id)
    );

    CREATE TABLE IF NOT EXISTS manager_evaluations (
      id_colaborador TEXT PRIMARY KEY,
      comentarios_soft_skills TEXT,
      avaliacao_pessoal_texto TEXT,
      data TEXT,
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
