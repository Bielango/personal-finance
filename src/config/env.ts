import "dotenv/config";
import { z } from "zod";

// As variáveis de ambiente também passam pelo Zod: se faltar algo, a API nem sobe.
const envSchema = z.object({
    JWT_SECRET: z
        .string({ error: "A variável JWT_SECRET não foi configurada" })
        .min(16, "A JWT_SECRET deve ter pelo menos 16 caracteres"),
    JWT_EXPIRES_IN: z.string().default("8h"),
    DATABASE_FILE: z.string().default("personal-finance.db"),
    PORT: z.coerce.number().int().positive().default(3000)
});

export const env = envSchema.parse(process.env);
