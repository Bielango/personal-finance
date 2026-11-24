// + = recebimento, - = gasto
export type OperacaoTransacao = "+" | "-";

// a = ativa, p = paga, c = cancelada
export type StatusTransacao = "a" | "p" | "c";

// O que aparece na listagem (sem a descrição).
export interface TransacaoResumo {
    id: number;
    titulo: string;
    operacao: OperacaoTransacao;
    valor: number;
    status: StatusTransacao;
    dataInicio: string;
    dataFim: string | null;
    contaId: number;
    contaNome: string;
    categoriaId: number;
    categoriaNome: string;
    agendamentoId: number | null;
    numeroOcorrencia: number | null;
}

export interface Transacao extends TransacaoResumo {
    descricao: string | null;
}
