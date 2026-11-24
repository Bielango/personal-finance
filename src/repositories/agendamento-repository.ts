import { Agendamento } from "../models/agendamento";
import { TransacaoResumo } from "../models/transacao";
import { AgendamentoInput } from "../schemas/agendamento-schema";

export interface AgendamentoRegistro extends Omit<Agendamento, "status" | "proximoVencimento"> {
    cancelado: boolean;
    ultimaOcorrencia: number;
    ultimoVencimento: string | null;
    primeiraPendente: string | null;
}

export interface AgendamentoRepository {
    atomico<T>(operacao: () => T): T;
    listar(): AgendamentoRegistro[];
    listarRecorrentesAtivos(): AgendamentoRegistro[];
    buscarPorId(id: number): AgendamentoRegistro | null;
    criar(dados: AgendamentoInput): number;
    atualizar(id: number, dados: AgendamentoInput): void;
    listarOcorrencias(id: number): TransacaoResumo[];
    vincular(id: number, transacaoId: number, numero: number): void;
    cancelar(id: number): void;
    excluirOcorrencias(id: number): void;
    excluir(id: number): void;
    existePorConta(contaId: number): boolean;
    existePorUsuario(usuarioId: number): boolean;
}
