import { Request, Response } from "express";
import { categoriaService } from "../container";

export function listarCategorias(_request: Request, response: Response) {
    return response.status(200).json(categoriaService.listar());
}

export function buscarCategoria(request: Request, response: Response) {
    return response.json(categoriaService.buscarPorId(Number(request.params.id)));
}

export function criarCategoria(request: Request, response: Response) {
    return response.status(201).json(categoriaService.criar(request.body.nome));
}

export function atualizarCategoria(request: Request, response: Response) {
    return response.json(categoriaService.atualizar(Number(request.params.id), request.body.nome));
}

export function excluirCategoria(request: Request, response: Response) {
    categoriaService.excluir(Number(request.params.id));
    return response.sendStatus(204);
}
