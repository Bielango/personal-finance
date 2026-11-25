import { atomico, db } from "../database/db";
import { AgendamentoInput } from "../schemas/agendamento-schema";
import { AgendamentoRegistro, AgendamentoRepository } from "./agendamento-repository";
import { CAMPOS_RESUMO, ORIGEM, mapearResumo } from "./transacao-repository-sqlite";

const SELECT_AGENDAMENTO = `
    SELECT A.AGE_ID AS id, A.AGE_TITULO AS titulo, A.AGE_DESCRICAO AS descricao,
           A.AGE_OPERACAO AS operacao, A.AGE_VALOR AS valorCentavos, A.AGE_TIPO AS tipo,
           A.AGE_PRIMEIRO AS primeiroVencimento, A.AGE_PERIODICIDADE AS periodicidade,
           A.AGE_PARCELAS AS parcelas, A.AGE_ATE AS ate, A.AGE_CANCELADO AS cancelado,
           A.AGE_CON_ID AS contaId, C.CON_NOME AS contaNome,
           COALESCE(MAX(O.OCO_NUMERO), 0) AS ultimaOcorrencia,
           MAX(T.TRA_DATA_INICIO) AS ultimoVencimento,
           MIN(CASE WHEN T.TRA_STATUS = 'a' THEN T.TRA_DATA_INICIO END) AS primeiraPendente,
           COUNT(CASE WHEN T.TRA_STATUS = 'a' THEN 1 END) AS pendentes,
           COUNT(CASE WHEN T.TRA_STATUS = 'p' THEN 1 END) AS pagas
    FROM AGENDAMENTO A
    JOIN CONTA C ON C.CON_ID = A.AGE_CON_ID
    LEFT JOIN OCORRENCIA O ON O.OCO_AGE_ID = A.AGE_ID
    LEFT JOIN TRANSACAO T ON T.TRA_ID = O.OCO_TRA_ID`;

function mapear(registro: Record<string, unknown>): AgendamentoRegistro {
    const { valorCentavos, cancelado, ...campos } = registro;
    return {
        ...campos as Omit<AgendamentoRegistro, "valor" | "cancelado">,
        valor: Number(valorCentavos) / 100,
        cancelado: Boolean(cancelado)
    };
}

function valores(dados: AgendamentoInput) {
    return [
        dados.contaId, dados.titulo, dados.descricao || null,
        dados.operacao, Math.round(dados.valor * 100), dados.tipo, dados.primeiroVencimento,
        dados.tipo === "recorrente" ? dados.periodicidade : null,
        dados.tipo === "parcelado" ? dados.parcelas : null,
        dados.tipo === "recorrente" ? dados.ate ?? null : null
    ];
}

export class AgendamentoRepositorySqlite implements AgendamentoRepository {
    atomico = atomico;

    listar() {
        return db.prepare(`${SELECT_AGENDAMENTO} GROUP BY A.AGE_ID ORDER BY A.AGE_ID DESC`).all().map(mapear);
    }

    listarRecorrentesAtivos() {
        return db.prepare(`
            ${SELECT_AGENDAMENTO}
            WHERE A.AGE_TIPO = 'recorrente' AND A.AGE_CANCELADO = 0
            GROUP BY A.AGE_ID
        `).all().map(mapear);
    }

    buscarPorId(id: number) {
        const registro = db.prepare(`${SELECT_AGENDAMENTO} WHERE A.AGE_ID = ? GROUP BY A.AGE_ID`).get(id);
        return registro ? mapear(registro) : null;
    }

    criar(dados: AgendamentoInput): number {
        const resultado = db.prepare(`
            INSERT INTO AGENDAMENTO (
                AGE_CON_ID, AGE_TITULO, AGE_DESCRICAO, AGE_OPERACAO,
                AGE_VALOR, AGE_TIPO, AGE_PRIMEIRO, AGE_PERIODICIDADE, AGE_PARCELAS, AGE_ATE
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(...valores(dados));
        return Number(resultado.lastInsertRowid);
    }

    atualizar(id: number, dados: AgendamentoInput) {
        db.prepare(`
            UPDATE AGENDAMENTO SET AGE_CON_ID = ?, AGE_TITULO = ?,
                AGE_DESCRICAO = ?, AGE_OPERACAO = ?, AGE_VALOR = ?, AGE_TIPO = ?,
                AGE_PRIMEIRO = ?, AGE_PERIODICIDADE = ?, AGE_PARCELAS = ?, AGE_ATE = ?
            WHERE AGE_ID = ?
        `).run(...valores(dados), id);
    }

    listarOcorrencias(id: number) {
        return db.prepare(`
            SELECT ${CAMPOS_RESUMO} ${ORIGEM}
            WHERE O.OCO_AGE_ID = ? ORDER BY O.OCO_NUMERO
        `).all(id).map(mapearResumo);
    }

    vincular(id: number, transacaoId: number, numero: number) {
        db.prepare(`
            INSERT INTO OCORRENCIA (OCO_AGE_ID, OCO_TRA_ID, OCO_NUMERO) VALUES (?, ?, ?)
        `).run(id, transacaoId, numero);
    }

    cancelar(id: number) {
        db.prepare("UPDATE AGENDAMENTO SET AGE_CANCELADO = 1 WHERE AGE_ID = ?").run(id);
        db.prepare(`
            UPDATE TRANSACAO
            SET TRA_STATUS = 'c', TRA_DATA_FIM = datetime('now', 'localtime')
            WHERE TRA_STATUS = 'a' AND TRA_ID IN (
                SELECT OCO_TRA_ID FROM OCORRENCIA WHERE OCO_AGE_ID = ?
            )
        `).run(id);
    }

    excluirOcorrencias(id: number) {
        db.prepare(`
            DELETE FROM TRANSACAO WHERE TRA_ID IN (
                SELECT OCO_TRA_ID FROM OCORRENCIA WHERE OCO_AGE_ID = ?
            )
        `).run(id);
    }

    excluir(id: number) {
        db.prepare("DELETE FROM AGENDAMENTO WHERE AGE_ID = ?").run(id);
    }

    existePorConta(contaId: number) {
        return !!db.prepare("SELECT 1 FROM AGENDAMENTO WHERE AGE_CON_ID = ? LIMIT 1").get(contaId);
    }

    existePorUsuario(usuarioId: number) {
        return !!db.prepare(`
            SELECT 1 FROM AGENDAMENTO A JOIN CONTA C ON C.CON_ID = A.AGE_CON_ID
            WHERE C.CON_USU_ID = ? LIMIT 1
        `).get(usuarioId);
    }
}
