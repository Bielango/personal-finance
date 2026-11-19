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
        usuarioId: Number(registro.usuarioId)
    };
}

const SELECT_CONTA = `
    SELECT CON_ID            AS id,
           CON_NOME          AS nome,
           CON_INSTITUICAO   AS instituicao,
           CON_TIPO          AS tipo,
           CON_SALDO         AS saldoCentavos,
           CON_USU_ID        AS usuarioId
    FROM CONTA`;

export class ContaRepositorySqlite implements ContaRepository {
    listar(usuarioId: number): Conta[] {
        const contas = db.prepare(`
            ${SELECT_CONTA}
            WHERE CON_USU_ID = ?
            ORDER BY CON_NOME
        `).all(usuarioId);
        return contas.map(mapearConta);
    }

    buscarPorId(id: number, usuarioId: number): Conta | null {
        const conta = db.prepare(`
            ${SELECT_CONTA}
            WHERE CON_ID = ? AND CON_USU_ID = ?
        `).get(id, usuarioId);
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

    criar(dados: ContaInput, usuarioId: number): Conta {
        const resultado = db.prepare(`
            INSERT INTO CONTA (
                CON_NOME, CON_INSTITUICAO, CON_TIPO, CON_SALDO, CON_USU_ID
            ) VALUES (?, ?, ?, ?, ?)
        `).run(
            dados.nome,
            dados.instituicao ?? null,
            dados.tipo,
            Math.round(dados.saldo * 100),
            usuarioId
        );

        const conta = this.buscarPorId(Number(resultado.lastInsertRowid), usuarioId);
        if (!conta) throw new Error("Erro ao criar conta");
        return conta;
    }

    atualizar(id: number, dados: ContaInput, usuarioId: number): Conta | null {
        const resultado = db.prepare(`
            UPDATE CONTA
            SET CON_NOME = ?,
                CON_INSTITUICAO = ?,
                CON_TIPO = ?,
                CON_SALDO = ?
            WHERE CON_ID = ? AND CON_USU_ID = ?
        `).run(
            dados.nome,
            dados.instituicao ?? null,
            dados.tipo,
            Math.round(dados.saldo * 100),
            id,
            usuarioId
        );

        if (resultado.changes === 0) return null;
        return this.buscarPorId(id, usuarioId);
    }

    excluir(id: number, usuarioId: number): boolean {
        const resultado = db.prepare(`
            DELETE FROM CONTA
            WHERE CON_ID = ? AND CON_USU_ID = ?
        `).run(id, usuarioId);
        return resultado.changes > 0;
    }
}
