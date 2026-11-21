import { Request, Response } from "express";
import { usuarioService } from "../container";

export function listarUsuarios(_request: Request, response: Response) {
    return response.status(200).json(usuarioService.listar());
}

export function buscarUsuarioPorId(request: Request, response: Response) {
    return response.status(200).json(usuarioService.buscarPorId(Number(request.params.id)));
}

export function criarUsuario(request: Request, response: Response) {
    return response.status(201).json(usuarioService.criar(request.body));
}

export function criarPrimeiroUsuario(request: Request, response: Response) {
    return response.status(201).json(usuarioService.criarPrimeiro(request.body));
}

export function atualizarUsuario(request: Request, response: Response) {
    return response.status(200).json(
        usuarioService.atualizar(Number(request.params.id), request.body)
    );
}

export function excluirUsuario(request: Request, response: Response) {
    usuarioService.excluir(Number(request.params.id), request.usuarioId!);
    return response.status(204).send();
}
