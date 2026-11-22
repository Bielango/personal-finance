import { z } from "zod";

const emailSchema = z
    .string({ error: "Informe o email" })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Informe um email valido" }).max(100, "O email deve ter no maximo 100 caracteres"));

const usuarioBaseSchema = z.object({
    nome: z
        .string({ error: "Informe o nome do usuario" })
        .trim()
        .min(3, "O nome deve ter pelo menos 3 caracteres")
        .max(100, "O nome deve ter no maximo 100 caracteres"),
    email: emailSchema
});

// O bcrypt usa somente os primeiros 72 caracteres da senha.
const senhaSchema = z
    .string({ error: "Informe a senha" })
    .min(6, "A senha deve ter pelo menos 6 caracteres")
    .max(72, "A senha deve ter no maximo 72 caracteres");

export const usuarioInputSchema = usuarioBaseSchema.extend({
    senha: senhaSchema
});

export const usuarioAtualizacaoSchema = usuarioBaseSchema.extend({
    senha: senhaSchema.optional()
});

export const usuarioIdSchema = z.object({
    id: z.coerce
        .number({ error: "O id deve ser um numero" })
        .int("O id deve ser um numero inteiro")
        .positive("O id deve ser positivo")
});

export const loginSchema = z.object({
    email: emailSchema,
    senha: z
        .string({ error: "Informe a senha" })
        .min(1, "Informe a senha")
});

export type UsuarioInput = z.infer<typeof usuarioInputSchema>;
export type UsuarioAtualizacaoInput = z.infer<typeof usuarioAtualizacaoSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
