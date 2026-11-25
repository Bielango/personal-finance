// Parcelas e ocorrências de agendamentos seguem a regra da Única.
export const CATEGORIA_UNICA = 1;

export interface Categoria {
    id: number;
    nome: string;
    // Única: false (paga uma vez). Recorrente: true (pode ser paga várias vezes).
    permiteRepetir: boolean;
}
