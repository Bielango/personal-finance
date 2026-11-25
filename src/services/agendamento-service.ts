import { AppError } from "../errors/app-error";
import { Agendamento, AgendamentoDetalhe } from "../models/agendamento";
import { CATEGORIA_UNICA } from "../models/categoria";
import { AgendamentoRegistro, AgendamentoRepository } from "../repositories/agendamento-repository";
import { ContaRepository } from "../repositories/conta-repository";
import { TransacaoRepository } from "../repositories/transacao-repository";
import { AgendamentoInput } from "../schemas/agendamento-schema";

const DIAS_ANTECEDENCIA = 45;

function hojeLocal() {
    const agora = new Date();
    return new Date(Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate()));
}

function formatarData(data: Date) {
    return data.toISOString().slice(0, 10);
}

function vencimento(agenda: AgendamentoRegistro, numero: number): string | null {
    if (agenda.parcelas !== null && numero > agenda.parcelas) return null;

    const [ano, mes, dia] = agenda.primeiroVencimento.split("-").map(Number);
    const intervalo = numero - 1;
    let data: Date;
    if (agenda.periodicidade === "semanal") {
        data = new Date(Date.UTC(ano, mes - 1, dia + intervalo * 7));
    } else {
        // Usa o dia original para que 31/jan → 28/fev → 31/mar.
        const mesAlvo = mes - 1 + intervalo * (agenda.periodicidade === "anual" ? 12 : 1);
        const ultimoDia = new Date(Date.UTC(ano, mesAlvo + 1, 0)).getUTCDate();
        data = new Date(Date.UTC(ano, mesAlvo, Math.min(dia, ultimoDia)));
    }
    if (data.getUTCFullYear() > 9999) return null;
    const resultado = formatarData(data);
    return agenda.ate && resultado > agenda.ate ? null : resultado;
}

function resumir(registro: AgendamentoRegistro): Agendamento {
    const { cancelado, ultimaOcorrencia, ultimoVencimento: _ultimo, primeiraPendente, ...dados } = registro;
    const proximo = cancelado ? null : primeiraPendente ?? vencimento(registro, ultimaOcorrencia + 1);
    return {
        ...dados,
        proximoVencimento: proximo,
        status: cancelado ? "cancelado" : proximo ? "ativo" : "concluido"
    };
}

export class AgendamentoService {
    constructor(
        private readonly repository: AgendamentoRepository,
        private readonly transacaoRepository: TransacaoRepository,
        private readonly contaRepository: ContaRepository
    ) {}

    listar() {
        this.sincronizar();
        return this.repository.listar().map(resumir);
    }

    buscarPorId(id: number) {
        this.sincronizar();
        return this.detalhar(id);
    }

    criar(dados: AgendamentoInput) {
        return this.repository.atomico(() => {
            this.validarRelacoes(dados);
            const id = this.repository.criar(dados);
            this.gerarOcorrencias(this.buscarRegistro(id));
            return this.detalhar(id);
        });
    }

    atualizar(id: number, dados: AgendamentoInput) {
        return this.repository.atomico(() => {
            const agenda = this.buscarRegistro(id);
            if (agenda.cancelado || agenda.pagas > 0) {
                throw new AppError("Só é possível editar um agendamento ativo sem pagamentos", 409);
            }
            this.validarRelacoes(dados);
            this.repository.excluirOcorrencias(id);
            this.repository.atualizar(id, dados);
            this.gerarOcorrencias(this.buscarRegistro(id));
            return this.detalhar(id);
        });
    }

    cancelar(id: number) {
        return this.repository.atomico(() => {
            if (resumir(this.buscarRegistro(id)).status !== "ativo") {
                throw new AppError("Só é possível cancelar um agendamento ativo", 409);
            }
            this.repository.cancelar(id);
            return this.detalhar(id);
        });
    }

    excluir(id: number) {
        this.repository.atomico(() => {
            const agenda = this.buscarRegistro(id);
            if (!agenda.cancelado || agenda.pagas > 0) {
                throw new AppError("Só é possível excluir agendamentos cancelados sem pagamentos", 409);
            }
            this.repository.excluirOcorrencias(id);
            this.repository.excluir(id);
        });
    }

    sincronizar() {
        this.repository.atomico(() => {
            for (const agenda of this.repository.listarRecorrentesAtivos()) {
                this.gerarOcorrencias(agenda);
            }
        });
    }

    private buscarRegistro(id: number) {
        const registro = this.repository.buscarPorId(id);
        if (!registro) throw new AppError("Agendamento não encontrado", 404);
        return registro;
    }

    private detalhar(id: number): AgendamentoDetalhe {
        return { ...resumir(this.buscarRegistro(id)), ocorrencias: this.repository.listarOcorrencias(id) };
    }

    private validarRelacoes(dados: AgendamentoInput) {
        if (!this.contaRepository.buscarPorId(dados.contaId)) {
            throw new AppError("Conta não encontrada", 404);
        }
    }

    private gerarOcorrencias(agenda: AgendamentoRegistro) {
        const data = hojeLocal();
        const hoje = formatarData(data);
        data.setUTCDate(data.getUTCDate() + DIAS_ANTECEDENCIA);
        const horizonte = formatarData(data);
        let numero = agenda.ultimaOcorrencia + 1;
        let ultimoVencimento = agenda.ultimoVencimento ?? "";
        const centavos = Math.round(agenda.valor * 100);
        const parcelas = agenda.parcelas ?? 1;
        const base = Math.floor(centavos / parcelas);
        const resto = centavos % parcelas;

        for (let dia = vencimento(agenda, numero); dia; dia = vencimento(agenda, ++numero)) {
            // Recorrências incluem pelo menos uma data futura, mesmo fora da janela.
            if (agenda.tipo === "recorrente" && dia > horizonte && ultimoVencimento > hoje) break;
            const transacao = this.transacaoRepository.criar({
                contaId: agenda.contaId,
                // Cada parcela é paga uma vez, como a Única.
                categoriaId: CATEGORIA_UNICA,
                titulo: agenda.titulo,
                descricao: agenda.descricao ?? undefined,
                operacao: agenda.operacao,
                valor: (base + (numero <= resto ? 1 : 0)) / 100
            }, dia);
            this.repository.vincular(agenda.id, transacao.id, numero);
            ultimoVencimento = dia;
        }
    }
}
