import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";

type Origem = "body" | "params" | "query";

export function validar(schema: ZodType, origem: Origem) {
    return (request: Request, response: Response, next: NextFunction) => {
        const resultado = schema.safeParse(request[origem]);
        if (!resultado.success) {
            return response.status(400).json({
                mensagem: "Dados inválidos",
                erros: resultado.error.issues.map(erro => ({
                    campo: erro.path.join("."),
                    mensagem: erro.message
                }))
            });
        }

        // Troca o valor original pelo validado (já convertido e sem campos extras).
        // No Express 5 o req.query é recalculado a cada leitura, por isso a propriedade
        // é redefinida em vez de só alterar o objeto.
        Object.defineProperty(request, origem, {
            value: resultado.data,
            writable: true,
            enumerable: true,
            configurable: true
        });
        return next();
    };
}
