import { Request, Response } from "express";
import { categoriaService } from "../container";

export function listarCategorias(_request: Request, response: Response) {
    return response.status(200).json(categoriaService.listar());
}

export function buscarCategoria(request: Request, response: Response) {
    return response.json(categoriaService.buscarPorId(Number(request.params.id)));
}
