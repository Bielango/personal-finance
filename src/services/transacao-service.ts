import { AppError } from "../errors/app-error";
import { Transacao } from "../models/transacao";
import { CategoriaRepository } from "../repositories/categoria-repository";
import { ContaRepository } from "../repositories/conta-repository";
import { TransacaoRepository } from "../repositories/transacao-repository";
import { TransacaoFiltro, TransacaoInput } from "../schemas/transacao-schema";

// Ciclo: criar -> ativa (a) -> paga (p), que pode ser paga de novo.
// Ativa ou paga pode ser editada ou cancelada (c). Só cancelada pode ser excluída.
export class TransacaoService {
    constructor(
        private readonly repository: TransacaoRepository,
        private readonly contaRepository: ContaRepository,
        private readonly categoriaRepository: CategoriaRepository
    ) {}

    listar(filtro: TransacaoFiltro) {
        return this.repository.listar(filtro);
    }

    buscarPorId(id: number) {
        const transacao = this.repository.buscarPorId(id);
        if (!transacao) throw new AppError("Transação não encontrada", 404);
        return transacao;
    }

    criar(dados: TransacaoInput) {
        this.validarRelacoes(dados);
        return this.repository.criar(dados);
    }

    // Não mexe no saldo: só um novo pagamento lança o valor na conta.
    atualizar(id: number, dados: TransacaoInput) {
        this.garantirNaoCancelada(this.buscarPorId(id), "editada");
        this.validarRelacoes(dados);

        const transacao = this.repository.atualizar(id, dados);
        if (!transacao) throw new AppError("Transação não encontrada", 404);
        return transacao;
    }

    // Cada pagamento soma (+) ou subtrai (-) o valor do saldo da conta.
    pagar(id: number) {
        this.garantirNaoCancelada(this.buscarPorId(id), "paga");

        const transacao = this.repository.pagar(id);
        if (!transacao) throw new AppError("Transação não encontrada", 404);
        return transacao;
    }

    // O que já foi pago não volta para a conta.
    cancelar(id: number) {
        if (this.buscarPorId(id).status === "c") {
            throw new AppError("A transação já está cancelada", 409);
        }

        const transacao = this.repository.cancelar(id);
        if (!transacao) throw new AppError("Transação não encontrada", 404);
        return transacao;
    }

    excluir(id: number) {
        if (this.buscarPorId(id).status !== "c") {
            throw new AppError("Só é possível excluir transações canceladas", 409);
        }
        if (!this.repository.excluir(id)) {
            throw new AppError("Transação não encontrada", 404);
        }
    }

    private garantirNaoCancelada(transacao: Transacao, acao: string) {
        if (transacao.status === "c") {
            throw new AppError(`Transação cancelada não pode ser ${acao}`, 409);
        }
    }

    private validarRelacoes(dados: TransacaoInput) {
        if (!this.contaRepository.buscarPorId(dados.contaId)) {
            throw new AppError("Conta não encontrada", 404);
        }
        if (!this.categoriaRepository.buscarPorId(dados.categoriaId)) {
            throw new AppError("Categoria não encontrada", 404);
        }
    }
}
