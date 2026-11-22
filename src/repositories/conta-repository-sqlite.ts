import { db } from "../database/db";
import { Conta } from "../models/conta";
import { ContaInput } from "../schemas/conta-schema";
import { ContaRepository } from "./conta-repository";

function mapearConta(registro: Record<string, unknown>): Conta {
    return {
        id: Number(registro.id),
        nome: String(registro.nome),
        instituicao: registro.instituicao === null ? null : String(registro.instituicao),
        tipo: registro.tipo as Conta["tipo"],
        saldo: Number(registro.saldoCentavos) / 100,
        usuarioId: Number(registro.usuarioId),
        usuarioNome: String(registro.usuarioNome)
    };
}

const SELECT_CONTA = `
    SELECT C.CON_ID          AS id,
           C.CON_NOME        AS nome,
           C.CON_INSTITUICAO AS instituicao,
           C.CON_TIPO        AS tipo,
           C.CON_SALDO       AS saldoCentavos,
           C.CON_USU_ID      AS usuarioId,
           U.USU_NOME        AS usuarioNome
    FROM CONTA C
    INNER JOIN USUARIO U ON U.USU_ID = C.CON_USU_ID`;

export class ContaRepositorySqlite implements ContaRepository {
    listar(): Conta[] {
        const contas = db.prepare(`
            ${SELECT_CONTA}
            ORDER BY U.USU_NOME, C.CON_NOME
        `).all();
        return contas.map(mapearConta);
    }

    buscarPorId(id: number): Conta | null {
        const conta = db.prepare(`
            ${SELECT_CONTA}
            WHERE C.CON_ID = ?
        `).get(id);
        return conta ? mapearConta(conta) : null;
    }

    nomeEmUso(nome: string, usuarioId: number, ignorarId = 0): boolean {
        return db.prepare(`
            SELECT 1
            FROM CONTA
            WHERE CON_USU_ID = ?
              AND CON_NOME = ? COLLATE NOCASE
              AND CON_ID <> ?
        `).get(usuarioId, nome, ignorarId) !== undefined;
    }

    criar(dados: ContaInput): Conta {
        const resultado = db.prepare(`
            INSERT INTO CONTA (
                CON_NOME, CON_INSTITUICAO, CON_TIPO, CON_SALDO, CON_USU_ID
            ) VALUES (?, ?, ?, ?, ?)
        `).run(
            dados.nome,
            dados.instituicao ?? null,
            dados.tipo,
            Math.round(dados.saldo * 100),
            dados.usuarioId
        );

        const conta = this.buscarPorId(Number(resultado.lastInsertRowid));
        if (!conta) throw new Error("Erro ao criar conta");
        return conta;
    }

    atualizar(id: number, dados: ContaInput): Conta | null {
        const resultado = db.prepare(`
            UPDATE CONTA
            SET CON_NOME = ?,
                CON_INSTITUICAO = ?,
                CON_TIPO = ?,
                CON_SALDO = ?,
                CON_USU_ID = ?
            WHERE CON_ID = ?
        `).run(
            dados.nome,
            dados.instituicao ?? null,
            dados.tipo,
            Math.round(dados.saldo * 100),
            dados.usuarioId,
            id
        );

        if (resultado.changes === 0) return null;
        return this.buscarPorId(id);
    }

    excluir(id: number): boolean {
        const resultado = db.prepare(`
            DELETE FROM CONTA
            WHERE CON_ID = ?
        `).run(id);
        return resultado.changes > 0;
    }
}
