import { z } from "zod";

export const contaInputSchema = z.object({
    nome: z
        .string({ error: "Informe o nome da conta" })
        .trim()
        .min(2, "O nome deve ter pelo menos 2 caracteres")
        .max(100, "O nome deve ter no maximo 100 caracteres"),
    instituicao: z
        .string({ error: "A instituicao deve ser um texto" })
        .trim()
        .min(2, "A instituicao deve ter pelo menos 2 caracteres")
        .max(100, "A instituicao deve ter no maximo 100 caracteres")
        .optional(),
    tipo: z.enum(["corrente", "poupanca", "investimento", "carteira"], {
        error: "O tipo deve ser corrente, poupanca, investimento ou carteira"
    }),
    saldo: z
        .number({ error: "Informe o saldo" })
        .finite("O saldo deve ser um numero valido")
        .min(-999_999_999, "O saldo e muito baixo")
        .max(999_999_999, "O saldo e muito alto")
        .multipleOf(0.01, "O saldo deve ter no maximo 2 casas decimais")
});

export const contaIdSchema = z.object({
    id: z.coerce
        .number({ error: "O id deve ser um numero" })
        .int("O id deve ser um numero inteiro")
        .positive("O id deve ser positivo")
});

export type ContaInput = z.infer<typeof contaInputSchema>;
