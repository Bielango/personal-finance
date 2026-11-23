import { Request, Response } from "express";
import { transacaoService } from "../container";
import { TransacaoFiltro } from "../schemas/transacao-schema";

export function listarTransacoes(request: Request, response: Response) {
    // O "validar" já trocou a query pelo filtro convertido pelo Zod.
    const filtro = request.query as unknown as TransacaoFiltro;
    return response.status(200).json(transacaoService.listar(filtro));
}

export function buscarTransacaoPorId(request: Request, response: Response) {
    return response.status(200).json(
        transacaoService.buscarPorId(Number(request.params.id))
    );
}

export function criarTransacao(request: Request, response: Response) {
    return response.status(201).json(
        transacaoService.criar(request.body)
    );
}

export function atualizarTransacao(request: Request, response: Response) {
    return response.status(200).json(
        transacaoService.atualizar(Number(request.params.id), request.body)
    );
}

export function pagarTransacao(request: Request, response: Response) {
    return response.status(200).json(
        transacaoService.pagar(Number(request.params.id))
    );
}

export function cancelarTransacao(request: Request, response: Response) {
    return response.status(200).json(
        transacaoService.cancelar(Number(request.params.id))
    );
}

export function excluirTransacao(request: Request, response: Response) {
    transacaoService.excluir(Number(request.params.id));
    return response.status(204).send();
}
