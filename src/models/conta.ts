export type TipoConta = "corrente" | "poupanca" | "investimento" | "carteira";

export interface Conta {
    id: number;
    nome: string;
    instituicao: string | null;
    tipo: TipoConta;
    saldo: number;
    usuarioId: number;
}
