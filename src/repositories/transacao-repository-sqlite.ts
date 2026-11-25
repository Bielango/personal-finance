import type { SQLInputValue } from "node:sqlite";
import { atomico, db } from "../database/db";
import { Transacao, TransacaoResumo } from "../models/transacao";
import { TransacaoFiltro, TransacaoInput } from "../schemas/transacao-schema";
import { TransacaoRepository } from "./transacao-repository";

export function mapearResumo(registro: Record<string, unknown>): TransacaoResumo {
    return {
        id: Number(registro.id),
        titulo: String(registro.titulo),
        operacao: registro.operacao as TransacaoResumo["operacao"],
        valor: Number(registro.valorCentavos) / 100,
        status: registro.status as TransacaoResumo["status"],
        dataInicio: String(registro.dataInicio),
        dataFim: registro.dataFim === null ? null : String(registro.dataFim),
        contaId: Number(registro.contaId),
        contaNome: String(registro.contaNome),
        categoriaId: Number(registro.categoriaId),
        categoriaNome: String(registro.categoriaNome),
        agendamentoId: registro.agendamentoId === null ? null : Number(registro.agendamentoId),
        numeroOcorrencia: registro.numeroOcorrencia === null ? null : Number(registro.numeroOcorrencia),
        totalParcelas: registro.totalParcelas === null ? null : Number(registro.totalParcelas)
    };
}

function mapearTransacao(registro: Record<string, unknown>): Transacao {
    return {
        ...mapearResumo(registro),
        descricao: registro.descricao === null ? null : String(registro.descricao)
    };
}

// Campos da listagem. A descrição só entra no buscarPorId.
export const CAMPOS_RESUMO = `
    T.TRA_ID          AS id,
    T.TRA_TITULO      AS titulo,
    T.TRA_OPERACAO    AS operacao,
    T.TRA_VALOR       AS valorCentavos,
    T.TRA_STATUS      AS status,
    T.TRA_DATA_INICIO AS dataInicio,
    T.TRA_DATA_FIM    AS dataFim,
    T.TRA_CON_ID      AS contaId,
    C.CON_NOME        AS contaNome,
    T.TRA_CAT_ID      AS categoriaId,
    K.CAT_NOME        AS categoriaNome,
    O.OCO_AGE_ID      AS agendamentoId,
    O.OCO_NUMERO      AS numeroOcorrencia,
    A.AGE_PARCELAS    AS totalParcelas`;

export const ORIGEM = `
    FROM TRANSACAO T
    INNER JOIN CONTA C      ON C.CON_ID = T.TRA_CON_ID
    INNER JOIN CATEGORIA K  ON K.CAT_ID = T.TRA_CAT_ID
    LEFT JOIN OCORRENCIA O  ON O.OCO_TRA_ID = T.TRA_ID
    LEFT JOIN AGENDAMENTO A ON A.AGE_ID = O.OCO_AGE_ID`;

// Só colunas desta lista entram no ORDER BY (nada vindo direto da requisição).
const COLUNAS_ORDENACAO: Record<TransacaoFiltro["ordenarPor"], string> = {
    data: "T.TRA_DATA_INICIO",
    codigo: "T.TRA_ID",
    status: "T.TRA_STATUS",
    categoria: "K.CAT_NOME",
    operacao: "T.TRA_OPERACAO",
    valor: "T.TRA_VALOR",
    conta: "C.CON_NOME"
};

export class TransacaoRepositorySqlite implements TransacaoRepository {
    listar(filtro: TransacaoFiltro): TransacaoResumo[] {
        const condicoes: string[] = [];
        const parametros: SQLInputValue[] = [];

        if (filtro.inicio) {
            condicoes.push("T.TRA_DATA_INICIO >= ?");
            parametros.push(filtro.inicio);
        }
        if (filtro.fim) {
            // Inclui o dia final inteiro.
            condicoes.push("T.TRA_DATA_INICIO < date(?, '+1 day')");
            parametros.push(filtro.fim);
        }
        if (filtro.contaId) {
            condicoes.push("T.TRA_CON_ID = ?");
            parametros.push(filtro.contaId);
        }
        if (filtro.status) {
            condicoes.push("T.TRA_STATUS = ?");
            parametros.push(filtro.status);
        }

        const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";
        const ordem = filtro.ordem === "asc" ? "ASC" : "DESC";

        return db.prepare(`
            SELECT ${CAMPOS_RESUMO}
            ${ORIGEM}
            ${where}
            ORDER BY ${COLUNAS_ORDENACAO[filtro.ordenarPor]} ${ordem}, T.TRA_ID ${ordem}
        `).all(...parametros).map(mapearResumo);
    }

    buscarPorId(id: number): Transacao | null {
        const transacao = db.prepare(`
            SELECT ${CAMPOS_RESUMO},
                   T.TRA_DESCRICAO AS descricao
            ${ORIGEM}
            WHERE T.TRA_ID = ?
        `).get(id);
        return transacao ? mapearTransacao(transacao) : null;
    }

    criar(dados: TransacaoInput, vencimento?: string): Transacao {
        const resultado = db.prepare(`
            INSERT INTO TRANSACAO (
                TRA_CON_ID, TRA_CAT_ID, TRA_TITULO, TRA_DESCRICAO, TRA_OPERACAO, TRA_VALOR, TRA_DATA_INICIO
            ) VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now', 'localtime')))
        `).run(
            dados.contaId,
            dados.categoriaId,
            dados.titulo,
            dados.descricao || null,
            dados.operacao,
            Math.round(dados.valor * 100),
            vencimento ?? null
        );

        const transacao = this.buscarPorId(Number(resultado.lastInsertRowid));
        if (!transacao) throw new Error("Erro ao criar transação");
        return transacao;
    }

    atualizar(id: number, dados: TransacaoInput): Transacao | null {
        const resultado = db.prepare(`
            UPDATE TRANSACAO
            SET TRA_CON_ID = ?,
                TRA_CAT_ID = ?,
                TRA_TITULO = ?,
                TRA_DESCRICAO = ?,
                TRA_OPERACAO = ?,
                TRA_VALOR = ?
            WHERE TRA_ID = ?
        `).run(
            dados.contaId,
            dados.categoriaId,
            dados.titulo,
            dados.descricao || null,
            dados.operacao,
            Math.round(dados.valor * 100),
            id
        );

        if (resultado.changes === 0) return null;
        return this.buscarPorId(id);
    }

    // Lança o valor no saldo da conta e marca como paga, tudo ou nada.
    pagar(id: number): Transacao | null {
        return atomico(() => {
            // Ativa sempre pode ser paga. Paga só de novo se a categoria permitir (Recorrente).
            const pagamento = db.prepare(`
                UPDATE TRANSACAO
                SET TRA_STATUS = 'p',
                    TRA_DATA_FIM = datetime('now', 'localtime')
                WHERE TRA_ID = ?
                  AND (TRA_STATUS = 'a' OR (TRA_STATUS = 'p' AND EXISTS (
                      SELECT 1 FROM CATEGORIA WHERE CAT_ID = TRA_CAT_ID AND CAT_REPETIR = 1
                  )))
                RETURNING TRA_CON_ID AS contaId,
                          CASE TRA_OPERACAO WHEN '+' THEN TRA_VALOR ELSE -TRA_VALOR END AS valor
            `).get(id);
            if (!pagamento) return null;
            db.prepare("UPDATE CONTA SET CON_SALDO = CON_SALDO + ? WHERE CON_ID = ?")
                .run(Number(pagamento.valor), Number(pagamento.contaId));
            return this.buscarPorId(id);
        });
    }

    cancelar(id: number): Transacao | null {
        const resultado = db.prepare(`
            UPDATE TRANSACAO
            SET TRA_STATUS = 'c',
                TRA_DATA_FIM = datetime('now', 'localtime')
            WHERE TRA_ID = ?
        `).run(id);

        if (resultado.changes === 0) return null;
        return this.buscarPorId(id);
    }

    excluir(id: number): boolean {
        return db.prepare("DELETE FROM TRANSACAO WHERE TRA_ID = ?").run(id).changes > 0;
    }

    existePorConta(contaId: number): boolean {
        return db.prepare(`
            SELECT 1
            FROM TRANSACAO
            WHERE TRA_CON_ID = ?
            LIMIT 1
        `).get(contaId) !== undefined;
    }

    existePorUsuario(usuarioId: number): boolean {
        return db.prepare(`
            SELECT 1
            FROM TRANSACAO T
            INNER JOIN CONTA C ON C.CON_ID = T.TRA_CON_ID
            WHERE C.CON_USU_ID = ?
            LIMIT 1
        `).get(usuarioId) !== undefined;
    }
}
