import { Request, Response } from "express";
import { usuarioService } from "../container";

export function criarUsuario(request: Request, response: Response) {
    return response.status(201).json(usuarioService.criar(request.body));
}
