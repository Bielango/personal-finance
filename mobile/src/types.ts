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
}

export interface LoginResponse {
    token: string;
    usuario: Usuario;
}

export interface ApiValidationError {
    campo: string;
    mensagem: string;
}
