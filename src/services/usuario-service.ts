import { AppError } from "../errors/app-error";
import { AgendamentoRepository } from "../repositories/agendamento-repository";
import { TransacaoRepository } from "../repositories/transacao-repository";
import { UsuarioRepository } from "../repositories/usuario-repository";
import { UsuarioAtualizacaoInput, UsuarioInput } from "../schemas/usuario-schema";

export class UsuarioService {
    constructor(
        private readonly repository: UsuarioRepository,
        private readonly transacaoRepository: TransacaoRepository,
        private readonly agendamentoRepository: AgendamentoRepository
    ) {}

    listar() {
        return this.repository.listar();
    }

    buscarPorId(id: number) {
        const usuario = this.repository.buscarPorId(id);
        if (!usuario) throw new AppError("Usuario nao encontrado", 404);
        return usuario;
    }

    criar(dados: UsuarioInput) {
        if (this.repository.emailEmUso(dados.email)) {
            throw new AppError("Email ja cadastrado", 409);
        }
        return this.repository.criar(dados);
    }

    criarPrimeiro(dados: UsuarioInput) {
        if (this.repository.contar() > 0) {
            throw new AppError("Ja existe um usuario cadastrado. Faca login.", 403);
        }
        return this.criar(dados);
    }

    atualizar(id: number, dados: UsuarioAtualizacaoInput) {
        if (!this.repository.buscarPorId(id)) {
            throw new AppError("Usuario nao encontrado", 404);
        }
        if (this.repository.emailEmUso(dados.email, id)) {
            throw new AppError("Email ja cadastrado", 409);
        }

        const usuario = this.repository.atualizar(id, dados);
        if (!usuario) throw new AppError("Usuario nao encontrado", 404);
        return usuario;
    }

    excluir(id: number, usuarioAutenticadoId: number) {
        if (id === usuarioAutenticadoId) {
            throw new AppError("Voce nao pode excluir o proprio usuario", 409);
        }
        this.agendamentoRepository.atomico(() => {
            if (this.agendamentoRepository.existePorUsuario(id) || this.transacaoRepository.existePorUsuario(id)) {
                throw new AppError("O usuário possui contas com agendamentos ou transações e não pode ser excluído", 409);
            }
            if (!this.repository.excluir(id)) {
                throw new AppError("Usuário não encontrado", 404);
            }
        });
    }
}
