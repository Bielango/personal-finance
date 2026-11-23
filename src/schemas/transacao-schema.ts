import { z } from "zod";

export const transacaoInputSchema = z.object({
    contaId: z
        .number({ error: "Informe a conta da transação" })
        .int("A conta deve ter um id inteiro")
        .positive("A conta deve ter um id positivo"),
    categoriaId: z
        .number({ error: "Informe a categoria da transação" })
        .int("A categoria deve ter um id inteiro")
        .positive("A categoria deve ter um id positivo"),
    titulo: z
        .string({ error: "Informe o título" })
        .trim()
        .min(2, "O título deve ter pelo menos 2 caracteres")
        .max(100, "O título deve ter no máximo 100 caracteres"),
    descricao: z
        .string({ error: "A descrição deve ser um texto" })
        .trim()
        .max(5000, "A descrição deve ter no máximo 5000 caracteres")
        .optional(),
    operacao: z.enum(["+", "-"], {
        error: "A operação deve ser + (recebimento) ou - (gasto)"
    }),
    valor: z
        .number({ error: "Informe o valor" })
        .positive("O valor deve ser maior que zero")
        .max(999_999_999, "O valor é muito alto")
        .multipleOf(0.01, "O valor deve ter no máximo 2 casas decimais")
});

export const transacaoIdSchema = z.object({
    id: z.coerce
        .number({ error: "O id deve ser um número" })
        .int("O id deve ser um número inteiro")
        .positive("O id deve ser positivo")
});

export const ordenacoesTransacao = ["data", "codigo", "status", "categoria", "operacao", "valor", "conta"] as const;

export const transacaoFiltroSchema = z
    .object({
        inicio: z.iso.date({ error: "A data inicial deve estar no formato AAAA-MM-DD" }).optional(),
        fim: z.iso.date({ error: "A data final deve estar no formato AAAA-MM-DD" }).optional(),
        contaId: z.coerce
            .number({ error: "A conta deve ser um número" })
            .int("A conta deve ter um id inteiro")
            .positive("A conta deve ter um id positivo")
            .optional(),
        status: z.enum(["a", "p", "c"], { error: "O status deve ser a, p ou c" }).optional(),
        ordenarPor: z
            .enum(ordenacoesTransacao, { error: `Ordene por: ${ordenacoesTransacao.join(", ")}` })
            .default("data"),
        ordem: z.enum(["asc", "desc"], { error: "A ordem deve ser asc ou desc" }).default("desc")
    })
    .refine(filtro => !filtro.inicio || !filtro.fim || filtro.inicio <= filtro.fim, {
        error: "A data final deve ser igual ou posterior à data inicial",
        path: ["fim"]
    });

export type TransacaoInput = z.infer<typeof transacaoInputSchema>;
export type TransacaoFiltro = z.infer<typeof transacaoFiltroSchema>;
