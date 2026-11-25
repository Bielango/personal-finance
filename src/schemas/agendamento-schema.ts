import { z } from "zod";
import { transacaoInputSchema } from "./transacao-schema";

const data = z.iso.date({ error: "Informe uma data válida no formato AAAA-MM-DD" })
    .refine(valor => valor >= "1900-01-01" && valor <= "9989-12-31", {
        error: "A data deve estar entre os anos 1900 e 9989"
    });
// Agendamento não tem categoria: cada parcela segue a regra da Única.
const base = transacaoInputSchema.omit({ categoriaId: true }).extend({ primeiroVencimento: data });

export const agendamentoInputSchema = z.discriminatedUnion("tipo", [
    base.extend({
        tipo: z.literal("parcelado"),
        parcelas: z.number().int().min(2).max(120)
    }).refine(dados => Math.round(dados.valor * 100) >= dados.parcelas, {
        error: "Cada parcela precisa ter pelo menos R$ 0,01",
        path: ["valor"]
    }),
    base.extend({
        tipo: z.literal("recorrente"),
        periodicidade: z.enum(["semanal", "mensal", "anual"], { error: "Selecione a frequência" }),
        ate: data.optional()
    }).refine(dados => !dados.ate || dados.ate >= dados.primeiroVencimento, {
        error: "A data final deve ser igual ou posterior ao primeiro vencimento",
        path: ["ate"]
    })
]);

export type AgendamentoInput = z.infer<typeof agendamentoInputSchema>;
