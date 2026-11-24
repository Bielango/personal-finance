import { z } from "zod";

export const categoriaInputSchema = z.object({
    nome: z.string({ error: "Informe o nome da categoria" })
        .trim()
        .min(2, "Use pelo menos 2 caracteres para a categoria")
        .max(100, "Use até 100 caracteres para a categoria")
        .transform(nome => nome.normalize("NFC"))
});

export type CategoriaInput = z.infer<typeof categoriaInputSchema>;
