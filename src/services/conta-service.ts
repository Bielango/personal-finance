import { AppError } from "../errors/app-error";
import { AgendamentoRepository } from "../repositories/agendamento-repository";
import { ContaRepository } from "../repositories/conta-repository";
import { TransacaoRepository } from "../repositories/transacao-repository";
import { UsuarioRepository } from "../repositories/usuario-repository";
import { ContaInput } from "../schemas/conta-schema";

export class ContaService {
    constructor(
        private readonly repository: ContaRepository,
        private readonly usuarioRepository: UsuarioRepository,
        private readonly transacaoRepository: TransacaoRepository,
        private readonly agendamentoRepository: AgendamentoRepository
    ) {}

    listar() {
        return this.repository.listar();
    }

    buscarPorId(id: number) {
        const conta = this.repository.buscarPorId(id);
        if (!conta) throw new AppError("Conta nao encontrada", 404);
        return conta;
    }

    criar(dados: ContaInput) {
        this.validarUsuario(dados.usuarioId);
        this.validarNomeUnico(dados.nome, dados.usuarioId);
        return this.repository.criar(dados);
    }

    atualizar(id: number, dados: ContaInput) {
        this.buscarPorId(id);
        this.validarUsuario(dados.usuarioId);
        this.validarNomeUnico(dados.nome, dados.usuarioId, id);

        const conta = this.repository.atualizar(id, dados);
        if (!conta) throw new AppError("Conta nao encontrada", 404);
        return conta;
    }

    excluir(id: number) {
        this.agendamentoRepository.atomico(() => {
            this.buscarPorId(id);
            if (this.agendamentoRepository.existePorConta(id) || this.transacaoRepository.existePorConta(id)) {
                throw new AppError("A conta possui agendamentos ou transações e não pode ser excluída", 409);
            }
            if (!this.repository.excluir(id)) {
                throw new AppError("Conta não encontrada", 404);
            }
        });
    }

    private validarNomeUnico(nome: string, usuarioId: number, ignorarId?: number) {
        if (this.repository.nomeEmUso(nome, usuarioId, ignorarId)) {
            throw new AppError("Ja existe uma conta com esse nome", 409);
        }
    }

    private validarUsuario(usuarioId: number) {
        if (!this.usuarioRepository.buscarPorId(usuarioId)) {
            throw new AppError("Usuario nao encontrado", 404);
        }
    }
}
