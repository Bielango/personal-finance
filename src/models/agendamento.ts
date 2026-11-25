import { OperacaoTransacao, TransacaoResumo } from "./transacao";

export type Periodicidade = "semanal" | "mensal" | "anual";

export interface Agendamento {
    id: number;
    titulo: string;
    descricao: string | null;
    operacao: OperacaoTransacao;
    valor: number;
    contaId: number;
    contaNome: string;
    categoriaId: number;
    categoriaNome: string;
    tipo: "parcelado" | "recorrente";
    primeiroVencimento: string;
    periodicidade: Periodicidade | null;
    parcelas: number | null;
    ate: string | null;
    status: "ativo" | "concluido" | "cancelado";
    pendentes: number;
    pagas: number;
    proximoVencimento: string | null;
}

export interface AgendamentoDetalhe extends Agendamento {
    ocorrencias: TransacaoResumo[];
}
