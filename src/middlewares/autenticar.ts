import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

// Exige o header "Authorization: Bearer <token>" com um JWT válido.
export const autenticar: RequestHandler = (request, response, next) => {
    const [tipo, token] = request.headers.authorization?.split(" ") ?? [];
    if (tipo !== "Bearer" || !token) {
        response.status(401).json({ mensagem: "Token de autenticação não informado" });
        return;
    }

    try {
        const payload = jwt.verify(token, env.JWT_SECRET);
        if (typeof payload === "string" || !payload.sub) {
            throw new Error("Token sem usuário");
        }

        request.usuarioId = Number(payload.sub);
        next();
    } catch {
        response.status(401).json({ mensagem: "Token inválido ou expirado" });
    }
};
