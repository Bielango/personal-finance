import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
    Botao, BotaoIcone, Cabecalho, Campo, Carregando, Confirmacao, Erro, Escolha, Estado, Etiqueta,
    FiltroStatus, Icone, Indicadores, Janela, ListaRegistros, Registro, Seletor, ui, Valor
} from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { converterValor, dataLocal, descreverOrigem, formatarData, formatarMoeda } from "../formatacao";
import {
    ApiError, atualizarTransacaoRequest, buscarTransacaoRequest, cancelarTransacaoRequest, criarTransacaoRequest,
    excluirTransacaoRequest, listarCategoriasRequest, listarContasRequest, listarTransacoesRequest, pagarTransacaoRequest, TransacaoInput
} from "../services/api";
import { colors, layout } from "../theme";
import { Categoria, Conta, OperacaoTransacao, OrdenacaoTransacao, StatusTransacao, Transacao, TransacaoResumo } from "../types";

const operacoes = {
    "+": { label: "Receita", icon: "arrow-down-outline", cor: colors.primary, fundo: colors.infoSoft, sinal: "+" },
    "-": { label: "Despesa", icon: "arrow-up-outline", cor: colors.expense, fundo: colors.warningSoft, sinal: "−" }
} as const;

const filtros: { valor: StatusTransacao | "todos"; label: string }[] = [
    { valor: "todos", label: "Todas" },
    { valor: "a", label: "Pendentes" },
    { valor: "p", label: "Confirmadas" },
    { valor: "c", label: "Canceladas" }
];

const ordenacoes: { valor: OrdenacaoTransacao; label: string }[] = [
    { valor: "data", label: "Data" },
    { valor: "codigo", label: "Código" },
    { valor: "status", label: "Status" },
    { valor: "categoria", label: "Categoria" },
    { valor: "operacao", label: "Movimentação" },
    { valor: "valor", label: "Valor" },
    { valor: "conta", label: "Conta" }
];

const ordenacaoDirecoes = [{ valor: "desc", label: "Decrescente" }, { valor: "asc", label: "Crescente" }] as const;
const dataMes = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

function formatarValor(transacao: TransacaoResumo) {
    return operacoes[transacao.operacao].sinal + " " + formatarMoeda(transacao.valor);
}

function formatarDataHora(texto: string) {
    const hora = texto.slice(11, 16);
    return formatarData(texto) + (hora ? " " + hora : "");
}

function confirmarBaixa(transacao: Transacao) {
    if (transacao.operacao === "+") return transacao.status === "p" ? "Receber de novo" : "Confirmar recebimento";
    return transacao.status === "p" ? "Pagar de novo" : "Confirmar pagamento";
}

function Status({ transacao }: { transacao: TransacaoResumo }) {
    if (transacao.status === "c") return <Etiqueta label="Cancelada" />;
    if (transacao.status === "a") return <Etiqueta label="Pendente" />;
    return <Etiqueta label={transacao.operacao === "+" ? "Recebida" : "Paga"} tom="success" />;
}

function Dado({ label, valor }: { label: string; valor: string }) {
    return (
        <View style={styles.detailRow}>
            <Text style={ui.muted}>{label}</Text>
            <Text style={[ui.rowTitle, styles.detailText]}>{valor}</Text>
        </View>
    );
}

function FormularioTransacao({ transacao, contas, categorias, ocupado, erro, salvar, fechar, abrirContas }: {
    transacao?: Transacao;
    contas: Conta[];
    categorias: Categoria[];
    ocupado: boolean;
    erro: string;
    salvar: (dados: TransacaoInput) => void;
    fechar: () => void;
    abrirContas: () => void;
}) {
    const [contaId, setContaId] = useState(transacao?.contaId ?? contas[0]?.id ?? null);
    const [categoriaId, setCategoriaId] = useState(transacao?.categoriaId ?? categorias[0]?.id ?? null);
    const [operacao, setOperacao] = useState<OperacaoTransacao>(transacao?.operacao ?? "-");
    const [titulo, setTitulo] = useState(transacao?.titulo ?? "");
    const [valor, setValor] = useState(transacao ? String(transacao.valor).replace(".", ",") : "");
    const [descricao, setDescricao] = useState(transacao?.descricao ?? "");
    const [seletor, setSeletor] = useState<"conta" | "categoria" | null>(null);
    const [erroLocal, setErroLocal] = useState("");

    function enviar() {
        if (ocupado) return;
        const quantia = converterValor(valor);
        if (!contaId || !categoriaId || !titulo.trim() || quantia === null || quantia <= 0) {
            setErroLocal("Informe a conta, a categoria, o título e um valor maior que zero.");
            return;
        }
        setErroLocal("");
        salvar({ contaId, categoriaId, titulo: titulo.trim(), descricao: descricao.trim() || undefined, operacao, valor: quantia });
    }

    return (
        <Janela titulo={transacao ? "Editar transação" : "Nova transação"} fechar={fechar} ocupada={ocupado}
            rodape={
                <>
                    <Erro mensagem={erroLocal || erro} />
                    <Botao label={transacao ? "Salvar alterações" : "Criar transação"} icon="checkmark"
                        busy={ocupado} disabled={!contas.length || !categorias.length} onPress={enviar} />
                </>
            }>
            {contas.length === 0 && (
                <View style={ui.section}>
                    <Text style={ui.muted}>Cadastre uma conta para registrar transações.</Text>
                    <View style={ui.wrap}><Botao label="Ir para Contas" variant="secondary" onPress={abrirContas} /></View>
                </View>
            )}
            <Escolha label="Movimentação" valor={operacao} selecionar={setOperacao} opcoes={[
                { valor: "-", label: operacoes["-"].label, icon: operacoes["-"].icon },
                { valor: "+", label: operacoes["+"].label, icon: operacoes["+"].icon }
            ]} />
            <Campo label="Título" value={titulo} onChangeText={setTitulo} placeholder={operacao === "+" ? "Ex.: Salário" : "Ex.: Mercado"} maxLength={100} />
            <Campo label="Valor (R$)" value={valor} onChangeText={setValor} keyboardType="decimal-pad" placeholder="0,00" />
            <Seletor label="Conta" valor={contaId} opcoes={contas.map(conta => ({
                valor: conta.id, label: conta.nome, descricao: formatarMoeda(conta.saldo), icon: "wallet-outline"
            }))} aberto={seletor === "conta"} alternar={() => setSeletor(seletor === "conta" ? null : "conta")}
                selecionar={id => { setContaId(id); setSeletor(null); }} />
            <Seletor label="Categoria" valor={categoriaId} opcoes={categorias.map(categoria => ({
                valor: categoria.id, label: categoria.nome,
                descricao: categoria.permiteRepetir ? "Pode ser confirmada várias vezes" : "Pode ser confirmada uma vez"
            }))} aberto={seletor === "categoria"} alternar={() => setSeletor(seletor === "categoria" ? null : "categoria")}
                selecionar={id => { setCategoriaId(id); setSeletor(null); }} />
            <Campo label="Descrição (opcional)" value={descricao} onChangeText={setDescricao} multiline maxLength={5000} />
        </Janela>
    );
}

type AcaoTransacao = "pagar" | "cancelar" | "excluir";
type Mes = { ano: number; mes: number };

function doMes(data: Date): Mes {
    return { ano: data.getFullYear(), mes: data.getMonth() };
}

export function TransacoesScreen({ inicial, abrirAgendamento, abrirContas }: {
    inicial?: Pick<TransacaoResumo, "id" | "dataInicio">;
    abrirAgendamento: (id: number) => void;
    abrirContas: () => void;
}) {
    const { token, sair } = useAuth();
    const [mes, setMes] = useState(() => inicial ? {
        ano: Number(inicial.dataInicio.slice(0, 4)), mes: Number(inicial.dataInicio.slice(5, 7)) - 1
    } : doMes(new Date()));
    const [status, setStatus] = useState<StatusTransacao | "todos">("todos");
    const [ordenarPor, setOrdenarPor] = useState<OrdenacaoTransacao>("data");
    const [ordem, setOrdem] = useState<"asc" | "desc">("desc");
    const [ordenacaoAberta, setOrdenacaoAberta] = useState(false);

    const [transacoes, setTransacoes] = useState<TransacaoResumo[]>([]);
    const [contas, setContas] = useState<Conta[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [erroLista, setErroLista] = useState("");
    const ultimoPedido = useRef(0);

    const [detalheId, setDetalheId] = useState(inicial?.id);
    const [detalhe, setDetalhe] = useState<Transacao>();
    const [formulario, setFormulario] = useState<{ transacao?: Transacao }>();
    const [confirmacao, setConfirmacao] = useState<AcaoTransacao>();
    const [ocupado, setOcupado] = useState(false);
    const [erro, setErro] = useState("");

    const carregar = useCallback(async (refresh = false) => {
        if (!token) return;
        const pedido = ++ultimoPedido.current;
        setAtualizando(refresh);
        setCarregando(!refresh);
        setErroLista("");
        const inicio = dataLocal(new Date(mes.ano, mes.mes, 1));
        const fim = dataLocal(new Date(mes.ano, mes.mes + 1, 0));

        try {
            const [lista, contasAtuais, categoriasAtuais] = await Promise.all([
                listarTransacoesRequest({ inicio, fim, status: status === "todos" ? undefined : status, ordenarPor, ordem }, token),
                listarContasRequest(token), listarCategoriasRequest(token)
            ]);
            if (pedido !== ultimoPedido.current) return;
            setTransacoes(lista);
            setContas(contasAtuais);
            setCategorias(categoriasAtuais);
        } catch (falha) {
            if (pedido !== ultimoPedido.current) return;
            if (falha instanceof ApiError && falha.status === 401) void sair();
            else setErroLista(falha instanceof ApiError ? falha.message : "Não foi possível carregar as transações.");
        } finally {
            if (pedido === ultimoPedido.current) {
                setCarregando(false);
                setAtualizando(false);
            }
        }
    }, [mes, ordem, ordenarPor, sair, status, token]);

    useEffect(() => {
        void carregar();
        return () => { ultimoPedido.current++; };
    }, [carregar]);

    useEffect(() => {
        if (!token || detalheId === undefined) return;
        let ativo = true;
        void buscarTransacaoRequest(detalheId, token).then(
            transacao => { if (ativo) setDetalhe(transacao); },
            falha => {
                if (!ativo) return;
                if (falha instanceof ApiError && falha.status === 401) void sair();
                else setErro(falha instanceof ApiError ? falha.message : "Não foi possível abrir a transação.");
            }
        );
        return () => { ativo = false; };
    }, [detalheId, sair, token]);

    function mudarMes(delta: number) {
        setMes(atual => doMes(new Date(atual.ano, atual.mes + delta, 1)));
    }

    function abrirDetalhe(item: TransacaoResumo) {
        setErro("");
        setDetalhe(undefined);
        setDetalheId(item.id);
    }

    function abrirFormulario(transacao?: Transacao) {
        setErro("");
        setDetalheId(undefined);
        setDetalhe(undefined);
        setFormulario({ transacao });
    }

    function fechar() {
        if (ocupado) return;
        setErro("");
        if (confirmacao) setConfirmacao(undefined);
        else if (formulario) setFormulario(undefined);
        else setDetalheId(undefined);
    }

    function tratarFalha(falha: unknown, texto: string) {
        if (falha instanceof ApiError && falha.status === 401) void sair();
        else setErro(falha instanceof ApiError ? falha.message : texto);
    }

    async function salvar(dados: TransacaoInput) {
        if (!token || !formulario || ocupado) return;
        setOcupado(true);
        setErro("");
        try {
            if (formulario.transacao) await atualizarTransacaoRequest(formulario.transacao.id, dados, token);
            else await criarTransacaoRequest(dados, token);
            setFormulario(undefined);
            const atual = doMes(new Date());
            if (!formulario.transacao && (atual.ano !== mes.ano || atual.mes !== mes.mes)) setMes(atual);
            else await carregar(true);
        } catch (falha) {
            tratarFalha(falha, "Não foi possível salvar a transação.");
        } finally {
            setOcupado(false);
        }
    }

    async function confirmar() {
        if (!token || !detalhe || !confirmacao || ocupado) return;
        setOcupado(true);
        setErro("");
        try {
            if (confirmacao === "excluir") {
                await excluirTransacaoRequest(detalhe.id, token);
                setDetalheId(undefined);
                setDetalhe(undefined);
            } else {
                const atualizar = confirmacao === "pagar" ? pagarTransacaoRequest : cancelarTransacaoRequest;
                setDetalhe(await atualizar(detalhe.id, token));
            }
            setConfirmacao(undefined);
            await carregar(true);
        } catch (falha) {
            tratarFalha(falha, "Não foi possível concluir a operação.");
        } finally {
            setOcupado(false);
        }
    }

    const data = dataMes.format(new Date(mes.ano, mes.mes, 1));
    const totais = transacoes.reduce((soma, item) => {
        if (item.status !== "c") soma[item.operacao] += Math.round(item.valor * 100);
        return soma;
    }, { "+": 0, "-": 0 });
    const semTotais = carregando || !!erroLista;
    const agendamentoId = detalhe?.agendamentoId;
    const podeRepetir = !agendamentoId && categorias.some(categoria => categoria.id === detalhe?.categoriaId && categoria.permiteRepetir);
    const detalhesConfirmacao = detalhe && confirmacao ? {
        pagar: {
            titulo: confirmarBaixa(detalhe) + "?",
            mensagem: detalhe.operacao === "+"
                ? "Vai entrar " + formatarMoeda(detalhe.valor) + " na conta " + detalhe.contaNome + "."
                : "Vai sair " + formatarMoeda(detalhe.valor) + " da conta " + detalhe.contaNome + ".",
            label: "Confirmar"
        },
        cancelar: {
            titulo: "Cancelar transação?",
            mensagem: detalhe.status === "p"
                ? "O valor já confirmado permanece no saldo. A transação ficará cancelada."
                : "A transação ficará cancelada e não poderá ser confirmada ou editada.",
            label: "Cancelar transação"
        },
        excluir: {
            titulo: "Excluir transação?",
            mensagem: "A transação " + detalhe.titulo + " será removida.",
            label: "Excluir transação"
        }
    }[confirmacao] : null;

    return (
        <>
            <ListaRegistros dados={transacoes} carregando={carregando} atualizando={atualizando} erro={erroLista}
                carregar={() => void carregar(true)}
                vazio={<Estado icon="swap-vertical-outline" titulo="Nenhuma transação neste período" />}
                cabecalho={
                    <>
                        <Cabecalho titulo="Transações" acao={<Botao label="Nova transação" icon="add" disabled={carregando || !!erroLista}
                            onPress={() => abrirFormulario()} />} />
                        <Indicadores itens={[
                            { label: "Receitas do filtro", valor: semTotais ? "—" : formatarMoeda(totais["+"] / 100) },
                            { label: "Despesas do filtro", valor: semTotais ? "—" : formatarMoeda(totais["-"] / 100), cor: colors.expense }
                        ]} controle={
                            <View style={styles.mes}>
                                <BotaoIcone label="Mês anterior" icon="chevron-back" onPress={() => mudarMes(-1)} />
                                <Text accessibilityLiveRegion="polite" style={styles.nomeMes}>{data.charAt(0).toUpperCase() + data.slice(1)}</Text>
                                <BotaoIcone label="Próximo mês" icon="chevron-forward" onPress={() => mudarMes(1)} />
                            </View>
                        } />
                        <FiltroStatus opcoes={filtros} valor={status} selecionar={setStatus} acao={
                            <Botao label="Ordenar" icon="swap-vertical-outline" variant="secondary" expanded={ordenacaoAberta}
                                onPress={() => setOrdenacaoAberta(!ordenacaoAberta)} />
                        } />
                        {ordenacaoAberta && (
                            <View style={[ui.card, styles.ordenacao]}>
                                <Escolha label="Ordenar por" opcoes={ordenacoes} valor={ordenarPor} selecionar={setOrdenarPor} />
                                <Escolha label="Direção" opcoes={ordenacaoDirecoes} valor={ordem} selecionar={setOrdem} />
                            </View>
                        )}
                    </>
                }
                renderItem={({ item }) => {
                    const info = operacoes[item.operacao];
                    return (
                        <Registro label={"Abrir " + item.titulo} abrir={() => abrirDetalhe(item)}
                            inicio={<Icone icon={info.icon} cor={info.cor} fundo={info.fundo} />}
                            fim={
                                <View style={[ui.recordEnd, styles.rowEnd]}>
                                    <Status transacao={item} />
                                    <Valor valor={item.valor} operacao={item.operacao} cor={item.status === "c" ? colors.muted : info.cor} />
                                </View>
                            }>
                            <Text style={[ui.rowTitle, item.status === "c" && styles.cancelada]}>{item.titulo}</Text>
                            <Text style={ui.muted}>{item.contaNome} · {descreverOrigem(item)}</Text>
                            <Text style={ui.muted}>{formatarDataHora(item.dataInicio)}</Text>
                        </Registro>
                    );
                }} />

            {formulario ? (
                <FormularioTransacao transacao={formulario.transacao} contas={contas} categorias={categorias} ocupado={ocupado}
                    erro={erro} salvar={dados => void salvar(dados)} fechar={fechar} abrirContas={abrirContas} />
            ) : detalhesConfirmacao ? (
                <Confirmacao {...detalhesConfirmacao} variant={confirmacao === "pagar" ? "primary" : "danger"}
                    fechar={fechar} confirmar={() => void confirmar()} busy={ocupado} erro={erro} />
            ) : detalheId !== undefined && (
                <Janela titulo={detalhe?.titulo ?? "Detalhes da transação"} fechar={fechar} ocupada={ocupado}>
                    <Erro mensagem={erro} />
                    {!detalhe ? (!erro && <Carregando />) : (
                        <>
                            <View style={styles.detalheResumo}>
                                <Icone icon={operacoes[detalhe.operacao].icon} cor={operacoes[detalhe.operacao].cor} fundo={operacoes[detalhe.operacao].fundo} />
                                <View style={ui.grow}>
                                    <Text style={[ui.money, styles.detalheValor]}>{formatarValor(detalhe)}</Text>
                                    <Text style={ui.muted}>{operacoes[detalhe.operacao].label}</Text>
                                </View>
                                <Status transacao={detalhe} />
                            </View>
                            <View>
                                <Dado label="Conta" valor={detalhe.contaNome} />
                                <Dado label={agendamentoId ? "Agendamento" : "Categoria"} valor={descreverOrigem(detalhe)} />
                                <Dado label={agendamentoId ? "Vencimento" : "Criada em"} valor={formatarDataHora(detalhe.dataInicio)} />
                                {detalhe.dataFim && (
                                    <Dado label={detalhe.status === "c" ? "Cancelada em" : "Última confirmação"} valor={formatarDataHora(detalhe.dataFim)} />
                                )}
                                <Dado label="Código" valor={"#" + detalhe.id} />
                            </View>
                            {detalhe.descricao && (
                                <View style={ui.section}>
                                    <Text style={ui.label}>Descrição</Text>
                                    <Text style={ui.muted}>{detalhe.descricao}</Text>
                                </View>
                            )}
                            {(detalhe.status === "a" || (detalhe.status === "p" && podeRepetir)) && (
                                <Botao label={confirmarBaixa(detalhe)} icon="checkmark" onPress={() => setConfirmacao("pagar")} />
                            )}
                            {agendamentoId ? (
                                <Botao label="Abrir agendamento" icon="calendar-outline" variant="secondary"
                                    onPress={() => abrirAgendamento(agendamentoId)} />
                            ) : detalhe.status === "c" ? (
                                <Botao label="Excluir transação" icon="trash-outline" variant="danger" onPress={() => setConfirmacao("excluir")} />
                            ) : (
                                <View style={ui.wrap}>
                                    <Botao label="Editar" icon="create-outline" variant="secondary" onPress={() => abrirFormulario(detalhe)} />
                                    <Botao label="Cancelar transação" variant="danger" onPress={() => setConfirmacao("cancelar")} />
                                </View>
                            )}
                        </>
                    )}
                </Janela>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    mes: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
    nomeMes: { ...ui.rowTitle, textAlign: "center", minWidth: 145 },
    ordenacao: { padding: 12, gap: 12 },
    rowEnd: { gap: 5 },
    cancelada: { textDecorationLine: "line-through", color: colors.muted },
    detalheResumo: { ...ui.row, padding: 12, borderRadius: layout.controlRadius, backgroundColor: colors.infoSoft },
    detalheValor: { fontSize: 21, lineHeight: 27 },
    detailRow: { ...ui.record, minHeight: 42, justifyContent: "space-between", flexWrap: "wrap" },
    detailText: { flexShrink: 1 }
});
