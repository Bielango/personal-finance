import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { env } from "../config/env";

export const db = new DatabaseSync(path.resolve(process.cwd(), env.DATABASE_FILE));

// O SQLite vem com as chaves estrangeiras desligadas.
db.exec("PRAGMA foreign_keys = ON");
db.exec("PRAGMA busy_timeout = 5000");

export function atomico<T>(operacao: () => T): T {
    db.exec("BEGIN IMMEDIATE");
    try {
        const resultado = operacao();
        db.exec("COMMIT");
        return resultado;
    } catch (erro) {
        db.exec("ROLLBACK");
        throw erro;
    }
}

function temColuna(tabela: string, coluna: string) {
    return db.prepare(`PRAGMA table_info(${tabela})`).all().some((registro) => registro.name === coluna);
}

function tabelaExiste(tabela: string) {
    return !!db.prepare("SELECT 1 FROM sqlite_schema WHERE type = 'table' AND name = ?").get(tabela);
}

// Bancos de antes das categorias fixas (Única e Recorrente) não são convertidos.
if ((tabelaExiste("CATEGORIA") && !temColuna("CATEGORIA", "CAT_REPETIR"))
    || (tabelaExiste("AGENDAMENTO") && temColuna("AGENDAMENTO", "AGE_CAT_ID"))) {
    throw new Error(
        `O banco ${env.DATABASE_FILE} está no formato antigo de categorias. Apague o arquivo e inicie a API de novo.`
    );
}

atomico(() => {
    db.exec(fs.readFileSync(path.resolve(process.cwd(), "src/database/schema.sql"), "utf8"));

    // Mantém compatibilidade com bancos criados antes da troca de saldoInicial para saldo.
    if (temColuna("CONTA", "CON_SALDO_INICIAL") && !temColuna("CONTA", "CON_SALDO")) {
        db.exec("ALTER TABLE CONTA RENAME COLUMN CON_SALDO_INICIAL TO CON_SALDO");
    }
});
