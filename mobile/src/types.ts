export interface Usuario {
    id: number;
    nome: string;
    email: string;
}

export type TipoConta = "corrente" | "poupanca" | "investimento" | "carteira";

export interface Conta {
    id: number;
    nome: string;
    instituicao: string | null;
    tipo: TipoConta;
    saldo: number;
    usuarioId: number;
    usuarioNome: string;
}

// Categorias fixas: Única (paga uma vez) e Recorrente (pode ser paga várias vezes).
export interface Categoria {
    id: number;
    nome: string;
    permiteRepetir: boolean;
}

// + = recebimento, - = gasto
export type OperacaoTransacao = "+" | "-";

// a = ativa, p = paga, c = cancelada
export type StatusTransacao = "a" | "p" | "c";

export type OrdenacaoTransacao =
    "data" | "codigo" | "status" | "categoria" | "operacao" | "valor" | "conta";

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
    totalParcelas: number | null;
}

export interface Transacao extends TransacaoResumo {
    descricao: string | null;
}

export interface LoginResponse {
    token: string;
    usuario: Usuario;
}

export interface ApiValidationError {
    campo: string;
    mensagem: string;
}

export type Periodicidade = "semanal" | "mensal" | "anual";

export interface Agendamento {
    id: number;
    titulo: string;
    descricao: string | null;
    operacao: OperacaoTransacao;
    valor: number;
    contaId: number;
    contaNome: string;
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
