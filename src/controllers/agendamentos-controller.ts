import { Request, Response } from "express";
import { agendamentoService } from "../container";

export function listarAgendamentos(_request: Request, response: Response) {
    return response.json(agendamentoService.listar());
}

export function buscarAgendamento(request: Request, response: Response) {
    return response.json(agendamentoService.buscarPorId(Number(request.params.id)));
}

export function criarAgendamento(request: Request, response: Response) {
    return response.status(201).json(agendamentoService.criar(request.body));
}

export function atualizarAgendamento(request: Request, response: Response) {
    return response.json(agendamentoService.atualizar(Number(request.params.id), request.body));
}

export function cancelarAgendamento(request: Request, response: Response) {
    return response.json(agendamentoService.cancelar(Number(request.params.id)));
}

export function excluirAgendamento(request: Request, response: Response) {
    agendamentoService.excluir(Number(request.params.id));
    return response.sendStatus(204);
}
