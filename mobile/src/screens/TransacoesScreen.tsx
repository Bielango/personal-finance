import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";
import { useAuth } from "../context/AuthContext";
import {
    ApiError,
    atualizarTransacaoRequest,
    buscarTransacaoRequest,
    cancelarTransacaoRequest,
    criarTransacaoRequest,
    excluirTransacaoRequest,
    listarCategoriasRequest,
    listarContasRequest,
    listarTransacoesRequest,
    pagarTransacaoRequest
} from "../services/api";
import { colors } from "../theme";
import {
    Categoria,
    Conta,
    OperacaoTransacao,
    OrdenacaoTransacao,
    StatusTransacao,
    Transacao,
    TransacaoResumo
} from "../types";

type IconName = keyof typeof Ionicons.glyphMap;

const MESES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const operacoes: Record<OperacaoTransacao, {
    label: string;
    icon: IconName;
    cor: string;
    fundo: string;
    sinal: string;
}> = {
    "+": { label: "Recebimento", icon: "arrow-down-outline", cor: colors.primary, fundo: "#EDF6F4", sinal: "+" },
    "-": { label: "Gasto", icon: "arrow-up-outline", cor: colors.danger, fundo: colors.dangerSoft, sinal: "−" }
};

const statusInfo: Record<StatusTransacao, { label: string; cor: string; fundo: string }> = {
    a: { label: "Ativa", cor: colors.info, fundo: colors.infoSoft },
    p: { label: "Paga", cor: colors.primary, fundo: "#EDF6F4" },
    c: { label: "Cancelada", cor: colors.muted, fundo: "#EEF1F0" }
};

const filtrosStatus: { valor: StatusTransacao | null; label: string }[] = [
    { valor: null, label: "Todas" },
    { valor: "a", label: "Ativas" },
    { valor: "p", label: "Pagas" },
    { valor: "c", label: "Canceladas" }
];

const ordenacoes: { valor: OrdenacaoTransacao; label: string; icon: IconName }[] = [
    { valor: "data", label: "Data", icon: "calendar-outline" },
    { valor: "codigo", label: "Código", icon: "barcode-outline" },
    { valor: "status", label: "Status", icon: "flag-outline" },
    { valor: "categoria", label: "Categoria", icon: "pricetag-outline" },
    { valor: "operacao", label: "Operação", icon: "swap-vertical-outline" },
    { valor: "valor", label: "Valor", icon: "cash-outline" },
    { valor: "conta", label: "Conta", icon: "wallet-outline" }
];

function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatarValor(transacao: { operacao: OperacaoTransacao; valor: number }) {
    return `${operacoes[transacao.operacao].sinal} ${formatarMoeda(transacao.valor)}`;
}

// "2026-11-23 14:05:00" -> "23/11/2026 14:05"
function formatarDataHora(texto: string) {
    const [data = "", hora = ""] = texto.split(" ");
    const [ano, mes, dia] = data.split("-");
    if (!ano || !mes || !dia) return texto;
    return `${dia}/${mes}/${ano}${hora ? ` ${hora.slice(0, 5)}` : ""}`;
}

function doisDigitos(numero: number) {
    return String(numero).padStart(2, "0");
}

// mes vai de 0 (janeiro) a 11 (dezembro)
function periodoDoMes(ano: number, mes: number) {
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    return {
        inicio: `${ano}-${doisDigitos(mes + 1)}-01`,
        fim: `${ano}-${doisDigitos(mes + 1)}-${doisDigitos(ultimoDia)}`
    };
}

// Aceita "1234,56", "1.234,56" e "1234.56".
function converterValor(texto: string) {
    let normalizado = texto.trim().replace(/\s/g, "").replace(/^R\$/, "");
    if (normalizado.includes(",")) {
        normalizado = normalizado.replace(/\./g, "").replace(",", ".");
    }
    if (!normalizado) return null;
    const numero = Number(normalizado);
    return Number.isFinite(numero) ? numero : null;
}

function mostrarErro(mensagem: string) {
    if (Platform.OS === "web") {
        globalThis.alert(mensagem);
    } else {
        Alert.alert("Erro", mensagem);
    }
}

function confirmar(
    titulo: string,
    mensagem: string,
    textoBotao: string,
    destrutivo: boolean,
    acao: () => void
) {
    if (Platform.OS === "web") {
        if (globalThis.confirm(mensagem)) acao();
        return;
    }

    Alert.alert(titulo, mensagem, [
        { text: "Voltar", style: "cancel" },
        { text: textoBotao, style: destrutivo ? "destructive" : "default", onPress: acao }
    ]);
}

function mesAtual() {
    const hoje = new Date();
    return { ano: hoje.getFullYear(), mes: hoje.getMonth() };
}

function LinhaDetalhe({ icon, label, valor }: { icon: IconName; label: string; valor: string }) {
    return (
        <View style={styles.detailRow}>
            <Ionicons name={icon} size={18} color={colors.muted} />
            <Text style={styles.detailLabel}>{label}</Text>
            <Text numberOfLines={1} style={styles.detailText}>{valor}</Text>
        </View>
    );
}

function StatusBadge({ status }: { status: StatusTransacao }) {
    const info = statusInfo[status];
    return (
        <View style={[styles.badge, { backgroundColor: info.fundo }]}>
            <Text style={[styles.badgeText, { color: info.cor }]}>{info.label}</Text>
        </View>
    );
}

export function TransacoesScreen() {
    const { token, sair } = useAuth();

    // Filtros da listagem
    const [mes, setMes] = useState(mesAtual);
    const [statusFiltro, setStatusFiltro] = useState<StatusTransacao | null>(null);
    const [ordenarPor, setOrdenarPor] = useState<OrdenacaoTransacao>("data");
    const [ordem, setOrdem] = useState<"asc" | "desc">("desc");
    const [ordenacaoAberta, setOrdenacaoAberta] = useState(false);

    const [transacoes, setTransacoes] = useState<TransacaoResumo[]>([]);
    const [contas, setContas] = useState<Conta[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [erroLista, setErroLista] = useState("");

    // Detalhe
    const [detalheVisivel, setDetalheVisivel] = useState(false);
    const [detalhe, setDetalhe] = useState<Transacao | null>(null);
    const [executando, setExecutando] = useState(false);

    // Formulário
    const [formularioVisivel, setFormularioVisivel] = useState(false);
    const [editando, setEditando] = useState<Transacao | null>(null);
    const [contaId, setContaId] = useState<number | null>(null);
    const [categoriaId, setCategoriaId] = useState<number | null>(null);
    const [operacao, setOperacao] = useState<OperacaoTransacao>("-");
    const [titulo, setTitulo] = useState("");
    const [valor, setValor] = useState("");
    const [descricao, setDescricao] = useState("");
    const [seletorAberto, setSeletorAberto] = useState<"conta" | "categoria" | null>(null);
    const [salvando, setSalvando] = useState(false);
    const [erroFormulario, setErroFormulario] = useState("");

    // Canceladas não entram nos totais.
    const totais = useMemo(() => transacoes.reduce(
        (total, transacao) => {
            if (transacao.status === "c") return total;
            if (transacao.operacao === "+") total.entradas += transacao.valor;
            else total.saidas += transacao.valor;
            return total;
        },
        { entradas: 0, saidas: 0 }
    ), [transacoes]);

    const contaSelecionada = contas.find(conta => conta.id === contaId);
    const categoriaSelecionada = categorias.find(categoria => categoria.id === categoriaId);
    const ordenacaoAtual = ordenacoes.find(item => item.valor === ordenarPor) ?? ordenacoes[0]!;

    const carregar = useCallback(async (refresh = false) => {
        if (!token) return;

        refresh ? setAtualizando(true) : setCarregando(true);
        setErroLista("");
        const { inicio, fim } = periodoDoMes(mes.ano, mes.mes);
        try {
            const [lista, contasCarregadas, categoriasCarregadas] = await Promise.all([
                listarTransacoesRequest({
                    inicio,
                    fim,
                    status: statusFiltro ?? undefined,
                    ordenarPor,
                    ordem
                }, token),
                listarContasRequest(token),
                listarCategoriasRequest(token)
            ]);
            setTransacoes(lista);
            setContas(contasCarregadas);
            setCategorias(categoriasCarregadas);
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
                await sair();
                return;
            }
            setErroLista(
                error instanceof ApiError
                    ? error.message
                    : "Não foi possível carregar as transações."
            );
        } finally {
            setCarregando(false);
            setAtualizando(false);
        }
    }, [token, sair, mes, statusFiltro, ordenarPor, ordem]);

    useEffect(() => {
        void carregar();
    }, [carregar]);

    function mudarMes(delta: number) {
        setMes(atual => {
            const data = new Date(atual.ano, atual.mes + delta, 1);
            return { ano: data.getFullYear(), mes: data.getMonth() };
        });
    }

    async function tratarErroDeAcao(error: unknown, mensagemPadrao: string) {
        if (error instanceof ApiError && error.status === 401) {
            await sair();
            return;
        }
        mostrarErro(error instanceof ApiError ? error.message : mensagemPadrao);
    }

    // ----- Detalhe -----

    async function abrirDetalhe(item: TransacaoResumo) {
        if (!token) return;
        setDetalhe(null);
        setDetalheVisivel(true);
        try {
            setDetalhe(await buscarTransacaoRequest(item.id, token));
        } catch (error) {
            setDetalheVisivel(false);
            await tratarErroDeAcao(error, "Não foi possível abrir a transação.");
        }
    }

    function fecharDetalhe() {
        if (!executando) setDetalheVisivel(false);
    }

    async function executarAcao(acao: "pagar" | "cancelar" | "excluir", transacao: Transacao) {
        if (!token) return;
        setExecutando(true);
        try {
            if (acao === "excluir") {
                await excluirTransacaoRequest(transacao.id, token);
                setDetalheVisivel(false);
                setDetalhe(null);
            } else {
                const atualizada = acao === "pagar"
                    ? await pagarTransacaoRequest(transacao.id, token)
                    : await cancelarTransacaoRequest(transacao.id, token);
                setDetalhe(atualizada);
            }
            await carregar(true);
        } catch (error) {
            await tratarErroDeAcao(error, "Não foi possível concluir a operação.");
        } finally {
            setExecutando(false);
        }
    }

    function confirmarPagamento(transacao: Transacao) {
        const efeito = transacao.operacao === "+"
            ? `Vai entrar ${formatarMoeda(transacao.valor)} na conta ${transacao.contaNome}.`
            : `Vai sair ${formatarMoeda(transacao.valor)} da conta ${transacao.contaNome}.`;
        confirmar(
            transacao.status === "p" ? "Pagar de novo" : "Pagar transação",
            `Pagar "${transacao.titulo}"? ${efeito}`,
            "Pagar",
            false,
            () => void executarAcao("pagar", transacao)
        );
    }

    function confirmarCancelamento(transacao: Transacao) {
        const aviso = transacao.status === "p" ? " O valor já pago não volta para a conta." : "";
        confirmar(
            "Cancelar transação",
            `Cancelar "${transacao.titulo}"? Ela não poderá mais ser paga nem editada.${aviso}`,
            "Cancelar transação",
            true,
            () => void executarAcao("cancelar", transacao)
        );
    }

    function confirmarExclusao(transacao: Transacao) {
        confirmar(
            "Excluir transação",
            `Excluir "${transacao.titulo}" de vez?`,
            "Excluir",
            true,
            () => void executarAcao("excluir", transacao)
        );
    }

    // ----- Formulário -----

    function abrirNovaTransacao() {
        setEditando(null);
        setContaId(contas[0]?.id ?? null);
        setCategoriaId(categorias[0]?.id ?? null);
        setOperacao("-");
        setTitulo("");
        setValor("");
        setDescricao("");
        setSeletorAberto(null);
        setErroFormulario("");
        setFormularioVisivel(true);
    }

    function abrirEdicao(transacao: Transacao) {
        setEditando(transacao);
        setContaId(transacao.contaId);
        setCategoriaId(transacao.categoriaId);
        setOperacao(transacao.operacao);
        setTitulo(transacao.titulo);
        setValor(String(transacao.valor).replace(".", ","));
        setDescricao(transacao.descricao ?? "");
        setSeletorAberto(null);
        setErroFormulario("");
        setDetalheVisivel(false);
        setFormularioVisivel(true);
    }

    function fecharFormulario() {
        if (!salvando) {
            setSeletorAberto(null);
            setFormularioVisivel(false);
        }
    }

    async function salvar() {
        if (!token) return;

        const valorNumerico = converterValor(valor);
        if (!contaId || !categoriaId || !titulo.trim() || valorNumerico === null || valorNumerico <= 0) {
            setErroFormulario("Informe a conta, a categoria, o título e um valor maior que zero.");
            return;
        }

        const dados = {
            contaId,
            categoriaId,
            titulo: titulo.trim(),
            ...(descricao.trim() ? { descricao: descricao.trim() } : {}),
            operacao,
            valor: valorNumerico
        };

        setSalvando(true);
        setErroFormulario("");
        try {
            if (editando) {
                await atualizarTransacaoRequest(editando.id, dados, token);
            } else {
                await criarTransacaoRequest(dados, token);
            }
            setFormularioVisivel(false);

            // Uma transação nova é sempre de hoje: volta para o mês atual se preciso.
            const atual = mesAtual();
            if (!editando && (atual.ano !== mes.ano || atual.mes !== mes.mes)) {
                setMes(atual);
            } else {
                await carregar(true);
            }
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
                await sair();
                return;
            }
            setErroFormulario(
                error instanceof ApiError
                    ? error.message
                    : "Não foi possível salvar a transação."
            );
        } finally {
            setSalvando(false);
        }
    }

    // ----- Listagem -----

    function renderTransacao({ item }: { item: TransacaoResumo }) {
        const info = operacoes[item.operacao];
        const cancelada = item.status === "c";

        return (
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Abrir ${item.titulo}`}
                onPress={() => void abrirDetalhe(item)}
                style={({ pressed }) => [styles.item, cancelada && styles.itemCanceled, pressed && styles.pressed]}
            >
                <View style={[styles.itemIcon, { backgroundColor: cancelada ? "#EEF1F0" : info.fundo }]}>
                    <Ionicons name={info.icon} size={22} color={cancelada ? colors.muted : info.cor} />
                </View>
                <View style={styles.itemInfo}>
                    <View style={styles.itemTopLine}>
                        <Text
                            numberOfLines={1}
                            style={[styles.itemTitle, cancelada && styles.strikethrough]}
                        >
                            {item.titulo}
                        </Text>
                        <StatusBadge status={item.status} />
                    </View>
                    <Text numberOfLines={1} style={styles.itemDetails}>
                        {item.contaNome} · {item.categoriaNome}
                    </Text>
                    <View style={styles.itemBottomLine}>
                        <Text numberOfLines={1} style={styles.itemDate}>
                            #{item.id} · {formatarDataHora(item.dataInicio)}
                        </Text>
                        <Text
                            numberOfLines={1}
                            style={[styles.itemValue, { color: cancelada ? colors.muted : info.cor }]}
                        >
                            {formatarValor(item)}
                        </Text>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
        );
    }

    const infoDetalhe = detalhe ? operacoes[detalhe.operacao] : null;

    return (
        <View style={styles.screen}>
            <View style={styles.titleRow}>
                <View>
                    <Text style={styles.title}>Transações</Text>
                    <Text style={styles.count}>{transacoes.length} no mês</Text>
                </View>
                <Pressable
                    accessibilityLabel="Adicionar transação"
                    onPress={abrirNovaTransacao}
                    style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
                >
                    <Ionicons name="add" size={22} color="#FFFFFF" />
                    <Text style={styles.addText}>Adicionar</Text>
                </Pressable>
            </View>

            <View style={styles.periodBand}>
                <View style={styles.monthRow}>
                    <Pressable
                        accessibilityLabel="Mês anterior"
                        onPress={() => mudarMes(-1)}
                        style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}
                    >
                        <Ionicons name="chevron-back" size={22} color={colors.info} />
                    </Pressable>
                    <Text style={styles.monthLabel}>{MESES[mes.mes]} de {mes.ano}</Text>
                    <Pressable
                        accessibilityLabel="Próximo mês"
                        onPress={() => mudarMes(1)}
                        style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}
                    >
                        <Ionicons name="chevron-forward" size={22} color={colors.info} />
                    </Pressable>
                </View>
                <View style={styles.totalsRow}>
                    <View style={styles.totalBox}>
                        <Text style={styles.totalLabel}>ENTRADAS</Text>
                        <Text numberOfLines={1} style={[styles.totalValue, { color: colors.primary }]}>
                            {formatarMoeda(totais.entradas)}
                        </Text>
                    </View>
                    <View style={styles.totalDivider} />
                    <View style={styles.totalBox}>
                        <Text style={styles.totalLabel}>SAÍDAS</Text>
                        <Text numberOfLines={1} style={[styles.totalValue, { color: colors.danger }]}>
                            {formatarMoeda(totais.saidas)}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.filterBar}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chips}
                >
                    {filtrosStatus.map(filtro => {
                        const selecionado = statusFiltro === filtro.valor;
                        return (
                            <Pressable
                                key={filtro.label}
                                accessibilityRole="button"
                                accessibilityState={{ selected: selecionado }}
                                onPress={() => setStatusFiltro(filtro.valor)}
                                style={({ pressed }) => [
                                    styles.chip,
                                    selecionado && styles.chipSelected,
                                    pressed && styles.pressed
                                ]}
                            >
                                <Text style={[styles.chipText, selecionado && styles.chipTextSelected]}>
                                    {filtro.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Ordenação"
                    accessibilityState={{ expanded: ordenacaoAberta }}
                    onPress={() => setOrdenacaoAberta(!ordenacaoAberta)}
                    style={({ pressed }) => [
                        styles.sortButton,
                        ordenacaoAberta && styles.chipSelected,
                        pressed && styles.pressed
                    ]}
                >
                    <Ionicons name={ordenacaoAtual.icon} size={16} color={colors.primary} />
                    <Ionicons
                        name={ordem === "desc" ? "arrow-down" : "arrow-up"}
                        size={14}
                        color={colors.primary}
                    />
                </Pressable>
            </View>

            {ordenacaoAberta && (
                <View style={styles.sortPanel}>
                    <Text style={styles.sortTitle}>Ordenar por</Text>
                    <View style={styles.sortOptions}>
                        {ordenacoes.map(item => {
                            const selecionado = ordenarPor === item.valor;
                            return (
                                <Pressable
                                    key={item.valor}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: selecionado }}
                                    onPress={() => setOrdenarPor(item.valor)}
                                    style={({ pressed }) => [
                                        styles.chip,
                                        styles.sortChip,
                                        selecionado && styles.chipSelected,
                                        pressed && styles.pressed
                                    ]}
                                >
                                    <Ionicons
                                        name={item.icon}
                                        size={15}
                                        color={selecionado ? colors.primary : colors.muted}
                                    />
                                    <Text style={[styles.chipText, selecionado && styles.chipTextSelected]}>
                                        {item.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                    <View style={styles.orderRow}>
                        {([
                            { valor: "desc", label: "Decrescente", icon: "arrow-down" },
                            { valor: "asc", label: "Crescente", icon: "arrow-up" }
                        ] as const).map(item => {
                            const selecionado = ordem === item.valor;
                            return (
                                <Pressable
                                    key={item.valor}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: selecionado }}
                                    onPress={() => setOrdem(item.valor)}
                                    style={({ pressed }) => [
                                        styles.orderOption,
                                        selecionado && styles.chipSelected,
                                        pressed && styles.pressed
                                    ]}
                                >
                                    <Ionicons
                                        name={item.icon}
                                        size={16}
                                        color={selecionado ? colors.primary : colors.muted}
                                    />
                                    <Text style={[styles.chipText, selecionado && styles.chipTextSelected]}>
                                        {item.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>
            )}

            {carregando ? (
                <View style={styles.centerState}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : erroLista ? (
                <View style={styles.centerState}>
                    <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
                    <Text style={styles.errorStateText}>{erroLista}</Text>
                    <Pressable onPress={() => void carregar()} style={styles.retryButton}>
                        <Text style={styles.retryText}>Tentar novamente</Text>
                    </Pressable>
                </View>
            ) : (
                <FlatList
                    data={transacoes}
                    keyExtractor={item => String(item.id)}
                    renderItem={renderTransacao}
                    contentContainerStyle={transacoes.length ? styles.list : styles.emptyList}
                    refreshControl={
                        <RefreshControl
                            refreshing={atualizando}
                            onRefresh={() => void carregar(true)}
                            colors={[colors.primary]}
                            tintColor={colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.centerState}>
                            <Ionicons name="receipt-outline" size={38} color={colors.info} />
                            <Text style={styles.emptyTitle}>
                                {statusFiltro ? "Nenhuma transação com esse filtro" : "Nenhuma transação neste mês"}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Detalhe da transação */}
            <Modal
                animationType="slide"
                transparent
                visible={detalheVisivel}
                onRequestClose={fecharDetalhe}
            >
                <View style={styles.modalOverlay}>
                    <Pressable style={styles.modalDismissArea} onPress={fecharDetalhe} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text numberOfLines={1} style={styles.modalTitle}>
                                {detalhe?.titulo ?? "Transação"}
                            </Text>
                            <Pressable
                                accessibilityLabel="Fechar"
                                disabled={executando}
                                onPress={fecharDetalhe}
                                style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
                            >
                                <Ionicons name="close" size={24} color={colors.text} />
                            </Pressable>
                        </View>

                        {!detalhe || !infoDetalhe ? (
                            <View style={styles.detailLoading}>
                                <ActivityIndicator size="large" color={colors.primary} />
                            </View>
                        ) : (
                            <ScrollView contentContainerStyle={styles.form}>
                                <View style={styles.detailHero}>
                                    <View style={[styles.itemIcon, { backgroundColor: infoDetalhe.fundo }]}>
                                        <Ionicons name={infoDetalhe.icon} size={22} color={infoDetalhe.cor} />
                                    </View>
                                    <View style={styles.itemInfo}>
                                        <Text style={[styles.detailValue, { color: infoDetalhe.cor }]}>
                                            {formatarValor(detalhe)}
                                        </Text>
                                        <Text style={styles.detailOperation}>{infoDetalhe.label}</Text>
                                    </View>
                                    <StatusBadge status={detalhe.status} />
                                </View>

                                <View style={styles.detailList}>
                                    <LinhaDetalhe icon="wallet-outline" label="Conta" valor={detalhe.contaNome} />
                                    <LinhaDetalhe icon="pricetag-outline" label="Categoria" valor={detalhe.categoriaNome} />
                                    <LinhaDetalhe
                                        icon="calendar-outline"
                                        label="Criada em"
                                        valor={formatarDataHora(detalhe.dataInicio)}
                                    />
                                    {!!detalhe.dataFim && (
                                        <LinhaDetalhe
                                            icon="time-outline"
                                            label={detalhe.status === "c" ? "Cancelada em" : "Último pagamento"}
                                            valor={formatarDataHora(detalhe.dataFim)}
                                        />
                                    )}
                                    <LinhaDetalhe icon="barcode-outline" label="Código" valor={`#${detalhe.id}`} />
                                </View>

                                <View style={styles.group}>
                                    <Text style={styles.label}>Descrição</Text>
                                    <Text style={detalhe.descricao ? styles.descriptionText : styles.descriptionEmpty}>
                                        {detalhe.descricao || "Sem descrição"}
                                    </Text>
                                </View>

                                {detalhe.status !== "c" ? (
                                    <>
                                        <Pressable
                                            disabled={executando}
                                            onPress={() => confirmarPagamento(detalhe)}
                                            style={({ pressed }) => [
                                                styles.saveButton,
                                                pressed && styles.pressed,
                                                executando && styles.disabled
                                            ]}
                                        >
                                            {executando ? (
                                                <ActivityIndicator color="#FFFFFF" />
                                            ) : (
                                                <>
                                                    <Ionicons name="checkmark-done-outline" size={21} color="#FFFFFF" />
                                                    <Text style={styles.saveText}>
                                                        {detalhe.status === "p" ? "Pagar de novo" : "Pagar"}
                                                    </Text>
                                                </>
                                            )}
                                        </Pressable>
                                        <View style={styles.actionRow}>
                                            <Pressable
                                                disabled={executando}
                                                onPress={() => abrirEdicao(detalhe)}
                                                style={({ pressed }) => [
                                                    styles.secondaryButton,
                                                    pressed && styles.pressed,
                                                    executando && styles.disabled
                                                ]}
                                            >
                                                <Ionicons name="pencil-outline" size={19} color={colors.info} />
                                                <Text style={[styles.secondaryText, { color: colors.info }]}>Editar</Text>
                                            </Pressable>
                                            <Pressable
                                                disabled={executando}
                                                onPress={() => confirmarCancelamento(detalhe)}
                                                style={({ pressed }) => [
                                                    styles.secondaryButton,
                                                    styles.dangerOutline,
                                                    pressed && styles.pressed,
                                                    executando && styles.disabled
                                                ]}
                                            >
                                                <Ionicons name="close-circle-outline" size={19} color={colors.danger} />
                                                <Text style={[styles.secondaryText, { color: colors.danger }]}>Cancelar</Text>
                                            </Pressable>
                                        </View>
                                    </>
                                ) : (
                                    <Pressable
                                        disabled={executando}
                                        onPress={() => confirmarExclusao(detalhe)}
                                        style={({ pressed }) => [
                                            styles.saveButton,
                                            styles.dangerButton,
                                            pressed && styles.pressed,
                                            executando && styles.disabled
                                        ]}
                                    >
                                        {executando ? (
                                            <ActivityIndicator color="#FFFFFF" />
                                        ) : (
                                            <>
                                                <Ionicons name="trash-outline" size={21} color="#FFFFFF" />
                                                <Text style={styles.saveText}>Excluir</Text>
                                            </>
                                        )}
                                    </Pressable>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Cadastro e edição */}
            <Modal
                animationType="slide"
                transparent
                visible={formularioVisivel}
                onRequestClose={fecharFormulario}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    style={styles.modalOverlay}
                >
                    <Pressable style={styles.modalDismissArea} onPress={fecharFormulario} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editando ? "Editar transação" : "Nova transação"}
                            </Text>
                            <Pressable
                                accessibilityLabel="Fechar"
                                disabled={salvando}
                                onPress={fecharFormulario}
                                style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
                            >
                                <Ionicons name="close" size={24} color={colors.text} />
                            </Pressable>
                        </View>

                        <ScrollView
                            contentContainerStyle={styles.form}
                            keyboardShouldPersistTaps="handled"
                        >
                            {contas.length === 0 && (
                                <View style={styles.infoBox}>
                                    <Ionicons name="information-circle-outline" size={19} color={colors.info} />
                                    <Text style={styles.infoText}>
                                        Cadastre uma conta na aba Contas antes de lançar transações.
                                    </Text>
                                </View>
                            )}

                            <View style={styles.group}>
                                <Text style={styles.label}>Operação</Text>
                                <View style={styles.segment}>
                                    {(["-", "+"] as const).map(item => {
                                        const info = operacoes[item];
                                        const selecionado = operacao === item;
                                        return (
                                            <Pressable
                                                key={item}
                                                accessibilityRole="button"
                                                accessibilityState={{ selected: selecionado }}
                                                onPress={() => setOperacao(item)}
                                                style={({ pressed }) => [
                                                    styles.segmentOption,
                                                    selecionado && {
                                                        backgroundColor: info.fundo,
                                                        borderColor: info.cor
                                                    },
                                                    pressed && styles.pressed
                                                ]}
                                            >
                                                <Ionicons
                                                    name={info.icon}
                                                    size={19}
                                                    color={selecionado ? info.cor : colors.muted}
                                                />
                                                <Text style={[
                                                    styles.segmentText,
                                                    selecionado && { color: info.cor }
                                                ]}>
                                                    {info.label}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>

                            <View style={styles.group}>
                                <Text style={styles.label}>Título</Text>
                                <TextInput
                                    value={titulo}
                                    onChangeText={setTitulo}
                                    placeholder={operacao === "+" ? "Ex.: Salário" : "Ex.: Mercado"}
                                    placeholderTextColor="#87928F"
                                    maxLength={100}
                                    style={styles.input}
                                />
                            </View>

                            <View style={styles.group}>
                                <Text style={styles.label}>Valor</Text>
                                <View style={styles.moneyField}>
                                    <Text style={styles.currencyPrefix}>R$</Text>
                                    <TextInput
                                        value={valor}
                                        onChangeText={setValor}
                                        placeholder="0,00"
                                        placeholderTextColor="#87928F"
                                        keyboardType="decimal-pad"
                                        style={styles.moneyInput}
                                    />
                                </View>
                            </View>

                            <View style={styles.group}>
                                <Text style={styles.label}>Conta</Text>
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityState={{ expanded: seletorAberto === "conta" }}
                                    onPress={() => setSeletorAberto(seletorAberto === "conta" ? null : "conta")}
                                    style={({ pressed }) => [styles.selectBox, pressed && styles.pressed]}
                                >
                                    <Ionicons name="wallet-outline" size={20} color={colors.primary} />
                                    <View style={styles.selectTextArea}>
                                        <Text numberOfLines={1} style={styles.selectValue}>
                                            {contaSelecionada?.nome ?? "Selecione uma conta"}
                                        </Text>
                                        {!!contaSelecionada && (
                                            <Text numberOfLines={1} style={styles.selectDetail}>
                                                {contaSelecionada.usuarioNome} · {formatarMoeda(contaSelecionada.saldo)}
                                            </Text>
                                        )}
                                    </View>
                                    <Ionicons
                                        name={seletorAberto === "conta" ? "chevron-up" : "chevron-down"}
                                        size={20}
                                        color={colors.muted}
                                    />
                                </Pressable>
                                {seletorAberto === "conta" && (
                                    <View style={styles.dropdown}>
                                        {contas.map(conta => {
                                            const selecionado = contaId === conta.id;
                                            return (
                                                <Pressable
                                                    key={conta.id}
                                                    onPress={() => {
                                                        setContaId(conta.id);
                                                        setSeletorAberto(null);
                                                    }}
                                                    style={({ pressed }) => [
                                                        styles.dropdownOption,
                                                        selecionado && styles.selectedOption,
                                                        pressed && styles.pressed
                                                    ]}
                                                >
                                                    <View style={styles.dropdownTextArea}>
                                                        <Text numberOfLines={1} style={styles.dropdownName}>
                                                            {conta.nome}
                                                        </Text>
                                                        <Text numberOfLines={1} style={styles.dropdownDetail}>
                                                            {conta.usuarioNome} · {formatarMoeda(conta.saldo)}
                                                        </Text>
                                                    </View>
                                                    {selecionado && (
                                                        <Ionicons name="checkmark" size={21} color={colors.primary} />
                                                    )}
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>

                            <View style={styles.group}>
                                <Text style={styles.label}>Categoria</Text>
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityState={{ expanded: seletorAberto === "categoria" }}
                                    onPress={() => setSeletorAberto(seletorAberto === "categoria" ? null : "categoria")}
                                    style={({ pressed }) => [styles.selectBox, pressed && styles.pressed]}
                                >
                                    <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
                                    <View style={styles.selectTextArea}>
                                        <Text numberOfLines={1} style={styles.selectValue}>
                                            {categoriaSelecionada?.nome ?? "Selecione uma categoria"}
                                        </Text>
                                    </View>
                                    <Ionicons
                                        name={seletorAberto === "categoria" ? "chevron-up" : "chevron-down"}
                                        size={20}
                                        color={colors.muted}
                                    />
                                </Pressable>
                                {seletorAberto === "categoria" && (
                                    <View style={styles.dropdown}>
                                        {categorias.map(categoria => {
                                            const selecionado = categoriaId === categoria.id;
                                            return (
                                                <Pressable
                                                    key={categoria.id}
                                                    onPress={() => {
                                                        setCategoriaId(categoria.id);
                                                        setSeletorAberto(null);
                                                    }}
                                                    style={({ pressed }) => [
                                                        styles.dropdownOption,
                                                        selecionado && styles.selectedOption,
                                                        pressed && styles.pressed
                                                    ]}
                                                >
                                                    <View style={styles.dropdownTextArea}>
                                                        <Text style={styles.dropdownName}>{categoria.nome}</Text>
                                                    </View>
                                                    {selecionado && (
                                                        <Ionicons name="checkmark" size={21} color={colors.primary} />
                                                    )}
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>

                            <View style={styles.group}>
                                <Text style={styles.label}>Descrição (opcional)</Text>
                                <TextInput
                                    value={descricao}
                                    onChangeText={setDescricao}
                                    placeholder="Detalhes da transação"
                                    placeholderTextColor="#87928F"
                                    multiline
                                    maxLength={5000}
                                    textAlignVertical="top"
                                    style={[styles.input, styles.textArea]}
                                />
                            </View>

                            {!!editando && (
                                <View style={styles.infoBox}>
                                    <Ionicons name="information-circle-outline" size={19} color={colors.info} />
                                    <Text style={styles.infoText}>
                                        Editar não altera o saldo da conta. O novo valor entra no próximo pagamento.
                                    </Text>
                                </View>
                            )}

                            {!!erroFormulario && (
                                <View style={styles.errorBox}>
                                    <Ionicons name="alert-circle-outline" size={19} color={colors.danger} />
                                    <Text style={styles.errorText}>{erroFormulario}</Text>
                                </View>
                            )}

                            <Pressable
                                disabled={salvando || contas.length === 0}
                                onPress={() => void salvar()}
                                style={({ pressed }) => [
                                    styles.saveButton,
                                    pressed && styles.pressed,
                                    (salvando || contas.length === 0) && styles.disabled
                                ]}
                            >
                                {salvando ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Ionicons name="save-outline" size={21} color="#FFFFFF" />
                                        <Text style={styles.saveText}>Salvar</Text>
                                    </>
                                )}
                            </Pressable>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background
    },
    titleRow: {
        minHeight: 82,
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12
    },
    title: {
        color: colors.text,
        fontSize: 22,
        fontWeight: "800"
    },
    count: {
        color: colors.muted,
        fontSize: 13,
        marginTop: 3
    },
    addButton: {
        minHeight: 42,
        paddingHorizontal: 14,
        borderRadius: 6,
        backgroundColor: colors.primary,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6
    },
    addText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "800"
    },
    periodBand: {
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 12,
        backgroundColor: colors.infoSoft,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    monthRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    monthButton: {
        width: 44,
        height: 40,
        alignItems: "center",
        justifyContent: "center"
    },
    monthLabel: {
        color: colors.text,
        fontSize: 17,
        fontWeight: "800"
    },
    totalsRow: {
        marginTop: 4,
        flexDirection: "row",
        alignItems: "center"
    },
    totalBox: {
        flex: 1,
        minWidth: 0,
        alignItems: "center"
    },
    totalDivider: {
        width: 1,
        height: 34,
        backgroundColor: colors.border
    },
    totalLabel: {
        color: colors.info,
        fontSize: 11,
        fontWeight: "800"
    },
    totalValue: {
        fontSize: 19,
        fontWeight: "800",
        marginTop: 3
    },
    filterBar: {
        minHeight: 54,
        paddingRight: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
        flexDirection: "row",
        alignItems: "center",
        gap: 8
    },
    chips: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8
    },
    chip: {
        minHeight: 34,
        paddingHorizontal: 13,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 17,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center"
    },
    chipSelected: {
        borderColor: colors.primary,
        backgroundColor: "#EDF6F4"
    },
    chipText: {
        color: colors.muted,
        fontSize: 13,
        fontWeight: "700"
    },
    chipTextSelected: {
        color: colors.primary
    },
    sortButton: {
        minHeight: 34,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 17,
        flexDirection: "row",
        alignItems: "center",
        gap: 3
    },
    sortPanel: {
        padding: 12,
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.surface
    },
    sortTitle: {
        color: colors.text,
        fontSize: 13,
        fontWeight: "800"
    },
    sortOptions: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8
    },
    sortChip: {
        flexDirection: "row",
        gap: 5
    },
    orderRow: {
        flexDirection: "row",
        gap: 8
    },
    orderOption: {
        flex: 1,
        minHeight: 38,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 6,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6
    },
    list: {
        padding: 14,
        gap: 10
    },
    emptyList: {
        flexGrow: 1
    },
    item: {
        minHeight: 92,
        paddingHorizontal: 12,
        paddingVertical: 11,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        backgroundColor: colors.surface,
        flexDirection: "row",
        alignItems: "center",
        gap: 10
    },
    itemCanceled: {
        opacity: 0.72
    },
    itemIcon: {
        width: 44,
        height: 44,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center"
    },
    itemInfo: {
        flex: 1,
        minWidth: 0
    },
    itemTopLine: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8
    },
    itemTitle: {
        flex: 1,
        color: colors.text,
        fontSize: 15,
        fontWeight: "800"
    },
    strikethrough: {
        textDecorationLine: "line-through",
        color: colors.muted
    },
    itemDetails: {
        color: colors.muted,
        fontSize: 12,
        marginTop: 3
    },
    itemBottomLine: {
        marginTop: 6,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8
    },
    itemDate: {
        flexShrink: 1,
        color: colors.muted,
        fontSize: 12
    },
    itemValue: {
        fontSize: 15,
        fontWeight: "800"
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10
    },
    badgeText: {
        fontSize: 11,
        fontWeight: "800"
    },
    centerState: {
        flex: 1,
        minHeight: 220,
        padding: 24,
        alignItems: "center",
        justifyContent: "center"
    },
    errorStateText: {
        color: colors.danger,
        fontSize: 14,
        textAlign: "center",
        marginTop: 10
    },
    retryButton: {
        minHeight: 42,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 10
    },
    retryText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: "800"
    },
    emptyTitle: {
        color: colors.text,
        fontSize: 16,
        fontWeight: "700",
        marginTop: 10
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(20, 34, 31, 0.48)"
    },
    modalDismissArea: {
        flex: 1
    },
    modalContent: {
        maxHeight: "90%",
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        backgroundColor: colors.surface
    },
    modalHeader: {
        minHeight: 62,
        paddingLeft: 18,
        paddingRight: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8
    },
    modalTitle: {
        flex: 1,
        color: colors.text,
        fontSize: 19,
        fontWeight: "800"
    },
    closeButton: {
        width: 46,
        height: 46,
        alignItems: "center",
        justifyContent: "center"
    },
    detailLoading: {
        minHeight: 260,
        alignItems: "center",
        justifyContent: "center"
    },
    detailHero: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12
    },
    detailValue: {
        fontSize: 24,
        fontWeight: "800"
    },
    detailOperation: {
        color: colors.muted,
        fontSize: 13,
        marginTop: 2
    },
    detailList: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        overflow: "hidden"
    },
    detailRow: {
        minHeight: 46,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: "row",
        alignItems: "center",
        gap: 9
    },
    detailLabel: {
        color: colors.muted,
        fontSize: 13,
        fontWeight: "700"
    },
    detailText: {
        flex: 1,
        color: colors.text,
        fontSize: 14,
        fontWeight: "700",
        textAlign: "right"
    },
    descriptionText: {
        color: colors.text,
        fontSize: 15,
        lineHeight: 21
    },
    descriptionEmpty: {
        color: colors.muted,
        fontSize: 14,
        fontStyle: "italic"
    },
    actionRow: {
        flexDirection: "row",
        gap: 10
    },
    secondaryButton: {
        flex: 1,
        height: 48,
        borderWidth: 1,
        borderColor: colors.info,
        borderRadius: 6,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7
    },
    secondaryText: {
        fontSize: 15,
        fontWeight: "800"
    },
    dangerOutline: {
        borderColor: colors.danger
    },
    dangerButton: {
        backgroundColor: colors.danger
    },
    form: {
        padding: 18,
        paddingBottom: 28,
        gap: 16
    },
    group: {
        gap: 6
    },
    label: {
        color: colors.text,
        fontSize: 14,
        fontWeight: "700"
    },
    segment: {
        flexDirection: "row",
        gap: 10
    },
    segmentOption: {
        flex: 1,
        height: 48,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 6,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7
    },
    segmentText: {
        color: colors.muted,
        fontSize: 15,
        fontWeight: "800"
    },
    selectBox: {
        minHeight: 52,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 6,
        backgroundColor: colors.surface,
        flexDirection: "row",
        alignItems: "center",
        gap: 9
    },
    selectTextArea: {
        flex: 1,
        minWidth: 0,
        paddingVertical: 7
    },
    selectValue: {
        flexShrink: 1,
        color: colors.text,
        fontSize: 15,
        fontWeight: "700"
    },
    selectDetail: {
        color: colors.muted,
        fontSize: 12,
        marginTop: 2
    },
    dropdown: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 6,
        backgroundColor: colors.surface,
        overflow: "hidden"
    },
    dropdownOption: {
        minHeight: 50,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: "row",
        alignItems: "center",
        gap: 9
    },
    selectedOption: {
        backgroundColor: "#EDF6F4"
    },
    dropdownTextArea: {
        flex: 1,
        minWidth: 0
    },
    dropdownName: {
        flexShrink: 1,
        color: colors.text,
        fontSize: 14,
        fontWeight: "700"
    },
    dropdownDetail: {
        color: colors.muted,
        fontSize: 12,
        marginTop: 2
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 6,
        backgroundColor: colors.surface,
        paddingHorizontal: 13,
        color: colors.text,
        fontSize: 16
    },
    textArea: {
        height: 110,
        paddingTop: 12
    },
    moneyField: {
        height: 50,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 6,
        flexDirection: "row",
        alignItems: "center"
    },
    currencyPrefix: {
        color: colors.muted,
        fontSize: 16,
        fontWeight: "700",
        paddingLeft: 13
    },
    moneyInput: {
        flex: 1,
        height: "100%",
        paddingHorizontal: 8,
        color: colors.text,
        fontSize: 16
    },
    infoBox: {
        padding: 11,
        borderRadius: 6,
        backgroundColor: colors.infoSoft,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8
    },
    infoText: {
        flex: 1,
        color: colors.info,
        fontSize: 13
    },
    errorBox: {
        padding: 11,
        borderRadius: 6,
        backgroundColor: colors.dangerSoft,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8
    },
    errorText: {
        flex: 1,
        color: colors.danger,
        fontSize: 14
    },
    saveButton: {
        height: 50,
        borderRadius: 6,
        backgroundColor: colors.primary,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8
    },
    saveText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800"
    },
    pressed: {
        opacity: 0.66
    },
    disabled: {
        opacity: 0.55
    }
});
