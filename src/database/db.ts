import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { env } from "../config/env";

export const db = new DatabaseSync(path.resolve(process.cwd(), env.DATABASE_FILE));

// O SQLite vem com as chaves estrangeiras desligadas.
db.exec("PRAGMA foreign_keys = ON");

// Cria as tabelas que ainda não existem.
db.exec(fs.readFileSync(path.resolve(process.cwd(), "src/database/schema.sql"), "utf8"));

// Mantem compatibilidade com bancos criados antes da troca de saldoInicial para saldo.
const colunasConta = db.prepare("PRAGMA table_info(CONTA)").all();
const temSaldoInicial = colunasConta.some((coluna) => coluna.name === "CON_SALDO_INICIAL");
const temSaldo = colunasConta.some((coluna) => coluna.name === "CON_SALDO");

if (temSaldoInicial && !temSaldo) {
    db.exec("ALTER TABLE CONTA RENAME COLUMN CON_SALDO_INICIAL TO CON_SALDO");
}
