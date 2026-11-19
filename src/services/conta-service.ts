import { AppError } from "../errors/app-error";
import { ContaRepository } from "../repositories/conta-repository";
import { ContaInput } from "../schemas/conta-schema";

export class ContaService {
    constructor(private readonly repository: ContaRepository) {}

    listar(usuarioId: number) {
        return this.repository.listar(usuarioId);
    }

    buscarPorId(id: number, usuarioId: number) {
        const conta = this.repository.buscarPorId(id, usuarioId);
        if (!conta) throw new AppError("Conta nao encontrada", 404);
        return conta;
    }

    criar(dados: ContaInput, usuarioId: number) {
        this.validarNomeUnico(dados.nome, usuarioId);
        return this.repository.criar(dados, usuarioId);
    }

    atualizar(id: number, dados: ContaInput, usuarioId: number) {
        this.buscarPorId(id, usuarioId);
        this.validarNomeUnico(dados.nome, usuarioId, id);

        const conta = this.repository.atualizar(id, dados, usuarioId);
        if (!conta) throw new AppError("Conta nao encontrada", 404);
        return conta;
    }

    excluir(id: number, usuarioId: number) {
        this.buscarPorId(id, usuarioId);
        if (!this.repository.excluir(id, usuarioId)) {
            throw new AppError("Conta nao encontrada", 404);
        }
    }

    private validarNomeUnico(nome: string, usuarioId: number, ignorarId?: number) {
        if (this.repository.nomeEmUso(nome, usuarioId, ignorarId)) {
            throw new AppError("Ja existe uma conta com esse nome", 409);
        }
    }
}
