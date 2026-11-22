import { Request, Response } from "express";
import { contaService } from "../container";

export function listarContas(_request: Request, response: Response) {
    return response.status(200).json(contaService.listar());
}

export function buscarContaPorId(request: Request, response: Response) {
    return response.status(200).json(
        contaService.buscarPorId(Number(request.params.id))
    );
}

export function criarConta(request: Request, response: Response) {
    return response.status(201).json(
        contaService.criar(request.body)
    );
}

export function atualizarConta(request: Request, response: Response) {
    return response.status(200).json(
        contaService.atualizar(Number(request.params.id), request.body)
    );
}

export function excluirConta(request: Request, response: Response) {
    contaService.excluir(Number(request.params.id));
    return response.status(204).send();
}
