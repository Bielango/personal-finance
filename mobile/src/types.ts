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

export interface Categoria {
    id: number;
    nome: string;
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
