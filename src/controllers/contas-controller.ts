import { Request, Response } from "express";
import { contaService } from "../container";

export function listarContas(request: Request, response: Response) {
    return response.status(200).json(contaService.listar(request.usuarioId!));
}

export function buscarContaPorId(request: Request, response: Response) {
    return response.status(200).json(
        contaService.buscarPorId(Number(request.params.id), request.usuarioId!)
    );
}

export function criarConta(request: Request, response: Response) {
    return response.status(201).json(
        contaService.criar(request.body, request.usuarioId!)
    );
}

export function atualizarConta(request: Request, response: Response) {
    return response.status(200).json(
        contaService.atualizar(Number(request.params.id), request.body, request.usuarioId!)
    );
}

export function excluirConta(request: Request, response: Response) {
    contaService.excluir(Number(request.params.id), request.usuarioId!);
    return response.status(204).send();
}
