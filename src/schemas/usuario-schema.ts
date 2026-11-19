import { z } from "zod";

// Guarda o email sempre sem espaços e em minúsculo, para "Ana@x.com" e "ana@x.com" serem o mesmo.
const emailSchema = z
    .string({ error: "Informe o email" })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Informe um email válido" }).max(100, "O email deve ter no máximo 100 caracteres"));

export const usuarioInputSchema = z.object({
    nome: z
        .string({ error: "Informe o nome do usuário" })
        .trim()
        .min(3, "O nome deve ter pelo menos 3 caracteres")
        .max(100, "O nome deve ter no máximo 100 caracteres"),
    email: emailSchema,
    // O bcrypt só usa os primeiros 72 caracteres da senha.
    senha: z
        .string({ error: "Informe a senha" })
        .min(6, "A senha deve ter pelo menos 6 caracteres")
        .max(72, "A senha deve ter no máximo 72 caracteres")
});

export const loginSchema = z.object({
    email: emailSchema,
    senha: z
        .string({ error: "Informe a senha" })
        .min(1, "Informe a senha")
});

export type UsuarioInput = z.infer<typeof usuarioInputSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
