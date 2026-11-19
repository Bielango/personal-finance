import { ErrorRequestHandler } from "express";
import { AppError } from "../errors/app-error";

export const erroHandler: ErrorRequestHandler = (error, _request, response, _next) => {
    if (error instanceof AppError) {
        response.status(error.statusCode).json({ mensagem: error.message });
        return;
    }

    // JSON mal formatado no corpo da requisição
    if (error instanceof SyntaxError && "body" in error) {
        response.status(400).json({ mensagem: "JSON inválido no corpo da requisição" });
        return;
    }

    console.error(error);
    response.status(500).json({ mensagem: "Erro interno de servidor" });
};
