import { Transacao, TransacaoResumo } from "../models/transacao";
import { TransacaoFiltro, TransacaoInput } from "../schemas/transacao-schema";

export interface TransacaoRepository {
    listar(filtro: TransacaoFiltro): TransacaoResumo[];
    buscarPorId(id: number): Transacao | null;
    criar(dados: TransacaoInput, vencimento?: string): Transacao;
    atualizar(id: number, dados: TransacaoInput): Transacao | null;
    pagar(id: number): Transacao | null;
    cancelar(id: number): Transacao | null;
    excluir(id: number): boolean;
    existePorConta(contaId: number): boolean;
    existePorUsuario(usuarioId: number): boolean;
}
