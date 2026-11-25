import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions
} from "react-native";
import { Botao, Cabecalho, Campo, Erro, Escolha, Estado, Janela, ui } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { converterData, converterValor, dataLocal, formatarData, formatarMoeda } from "../formatacao";
import {
    AgendamentoInput, ApiError, buscarAgendamentoRequest, cancelarAgendamentoRequest, excluirAgendamentoRequest,
    listarAgendamentosRequest, listarContasRequest, salvarAgendamentoRequest
} from "../services/api";
import { colors } from "../theme";
import { Agendamento, AgendamentoDetalhe, Conta, OperacaoTransacao, Periodicidade, TransacaoResumo } from "../types";

const frequencias: { valor: Periodicidade; label: string }[] = [
    { valor: "semanal", label: "Semanal" }, { valor: "mensal", label: "Mensal" }, { valor: "anual", label: "Anual" }
];
const estados = {
    ativo: { label: "Ativo", cor: colors.primary },
    concluido: { label: "Concluído", cor: colors.success },
    cancelado: { label: "Cancelado", cor: colors.muted }
};
const filtros = [
    { valor: "todos", label: "Todos" },
    { valor: "ativo", label: "Ativos" },
    { valor: "concluido", label: "Concluídos" },
    { valor: "cancelado", label: "Cancelados" }
] as const;
type Filtro = typeof filtros[number]["valor"];

function resumoTipo(agenda: Agendamento) {
    return agenda.tipo === "parcelado"
        ? `${agenda.parcelas} parcelas mensais`
        : `Recorrente · ${agenda.periodicidade}`;
}

function ValorAgenda({ agenda }: { agenda: Agendamento }) {
    return (
        <View style={styles.valueColumn}>
            <Text style={[ui.money, styles.amount, agenda.operacao === "+" && styles.income]}>
                {agenda.operacao === "+" ? "+" : "−"} {formatarMoeda(agenda.valor)}
            </Text>
            <Text style={ui.muted}>{agenda.tipo === "parcelado" ? "valor total" : "por ocorrência"}</Text>
        </View>
    );
}

function Formulario({ agenda, contas, ocupado, erro, salvar, fechar }: {
    agenda?: Agendamento;
    contas: Conta[];
    ocupado: boolean;
    erro: string;
    salvar: (dados: AgendamentoInput) => void;
    fechar: () => void;
}) {
    const { width } = useWindowDimensions();
    const [tipo, setTipo] = useState<Agendamento["tipo"]>(agenda?.tipo ?? "parcelado");
    const [operacao, setOperacao] = useState<OperacaoTransacao>(agenda?.operacao ?? "-");
    const [titulo, setTitulo] = useState(agenda?.titulo ?? "");
    const [descricao, setDescricao] = useState(agenda?.descricao ?? "");
    const [valor, setValor] = useState(agenda ? agenda.valor.toFixed(2).replace(".", ",") : "");
    const [primeiro, setPrimeiro] = useState(formatarData(agenda?.primeiroVencimento ?? dataLocal()));
    const [parcelas, setParcelas] = useState(String(agenda?.parcelas ?? 3));
    const [frequencia, setFrequencia] = useState<Periodicidade>(agenda?.periodicidade ?? "mensal");
    const [ate, setAte] = useState(agenda?.ate ? formatarData(agenda.ate) : "");
    const [contaId, setConta] = useState<number | null>(agenda?.contaId ?? contas[0]?.id ?? null);
    const [erroLocal, setErroLocal] = useState("");
    const valorNumerico = converterValor(valor);
    const totalParcelas = Number(parcelas);
    const centavos = Math.round((valorNumerico ?? 0) * 100);
    const mostrarPrevia = tipo === "parcelado" && Number.isInteger(totalParcelas)
        && totalParcelas >= 2 && totalParcelas <= 120 && centavos >= totalParcelas;
    const base = Math.floor(centavos / Math.max(totalParcelas, 1));
    const resto = centavos % totalParcelas;

    function enviar() {
        if (!contaId || !valorNumerico || valorNumerico < 0 || titulo.trim().length < 2) {
            setErroLocal("Preencha título, valor e conta.");
            return;
        }
        setErroLocal("");
        const comum = { contaId, titulo, descricao, valor: valorNumerico, operacao, primeiroVencimento: converterData(primeiro) };
        salvar(tipo === "parcelado"
            ? { ...comum, tipo, parcelas: totalParcelas }
            : { ...comum, tipo, periodicidade: frequencia, ate: ate.trim() ? converterData(ate) : undefined });
    }

    return (
        <Janela titulo={agenda ? "Editar agendamento" : "Novo agendamento"} fechar={fechar} rodape={
            <>
                <Erro mensagem={erroLocal || erro} />
                <Botao label={agenda ? "Salvar alterações" : "Criar agendamento"} icon="checkmark" onPress={enviar} busy={ocupado} />
            </>
        }>
            <View style={[styles.formFields, width >= 720 && styles.formColumns]}>
                <View style={ui.grow}>
                    <Escolha label="Tipo" valor={tipo} selecionar={setTipo} opcoes={[
                        { valor: "parcelado", label: "Parcelado" }, { valor: "recorrente", label: "Recorrente" }
                    ]} />
                </View>
                <View style={ui.grow}>
                    <Escolha label="Movimentação" valor={operacao} selecionar={setOperacao} opcoes={[
                        { valor: "-", label: "Despesa" }, { valor: "+", label: "Receita" }
                    ]} />
                </View>
            </View>
            <Campo label="Título" value={titulo} onChangeText={setTitulo} maxLength={100} placeholder="Ex.: Compra de móveis" />
            <View style={[styles.formFields, width >= 720 && styles.formColumns]}>
                <View style={ui.grow}>
                    <Campo label={tipo === "parcelado" ? "Valor total (R$)" : "Valor por ocorrência (R$)"}
                        value={valor} onChangeText={setValor} keyboardType="decimal-pad" placeholder="0,00" />
                </View>
                <View style={ui.grow}>
                    <Campo label="Primeiro vencimento" value={primeiro} onChangeText={setPrimeiro}
                        placeholder="DD/MM/AAAA" maxLength={10} />
                </View>
            </View>
            {tipo === "parcelado" ? (
                <>
                    <Campo label="Número de parcelas mensais" value={parcelas} onChangeText={setParcelas} keyboardType="number-pad" maxLength={3} />
                    {mostrarPrevia && (
                        <Text style={styles.preview}>
                            {resto > 0
                                ? `${resto} × ${formatarMoeda((base + 1) / 100)} + ${totalParcelas - resto} × ${formatarMoeda(base / 100)}`
                                : `${totalParcelas} × ${formatarMoeda(base / 100)}`}
                        </Text>
                    )}
                </>
            ) : (
                <>
                    <Escolha label="Frequência" valor={frequencia} selecionar={setFrequencia} opcoes={frequencias} />
                    <Campo label="Repetir até (opcional)" value={ate} onChangeText={setAte}
                        placeholder="DD/MM/AAAA" maxLength={10} />
                </>
            )}
            <Escolha label="Conta" valor={contaId} selecionar={setConta}
                opcoes={contas.map(conta => ({ valor: conta.id, label: conta.nome }))} />
            <Campo label="Descrição (opcional)" value={descricao} onChangeText={setDescricao} multiline maxLength={5000} />
        </Janela>
    );
}

export function AgendamentosScreen({ inicial, abrirContas, abrirTransacao }: {
    inicial?: number;
    abrirContas: () => void;
    abrirTransacao: (transacao: TransacaoResumo) => void;
}) {
    const { token, sair } = useAuth();
    const { width } = useWindowDimensions();
    const [lista, setLista] = useState<Agendamento[]>([]);
    const [contas, setContas] = useState<Conta[]>([]);
    const [filtro, setFiltro] = useState<Filtro>("todos");
    const [carregando, setCarregando] = useState(true);
    const [erroLista, setErroLista] = useState("");
    const [detalheId, setDetalheId] = useState(inicial);
    const [detalhe, setDetalhe] = useState<AgendamentoDetalhe>();
    const [formulario, setFormulario] = useState<{ agenda?: Agendamento }>();
    const [confirmacao, setConfirmacao] = useState<"cancelar" | "excluir">();
    const [erro, setErro] = useState("");
    const [ocupado, setOcupado] = useState(false);

    const tratarErro = useCallback((falha: unknown, definir: (mensagem: string) => void) => {
        if (falha instanceof ApiError && falha.status === 401) void sair();
        else definir(falha instanceof ApiError ? falha.message : "Não foi possível conectar à API.");
    }, [sair]);

    const carregar = useCallback(async () => {
        if (!token) return;
        setCarregando(true);
        setErroLista("");
        try {
            const [agendas, contasAtuais] = await Promise.all([
                listarAgendamentosRequest(token), listarContasRequest(token)
            ]);
            setLista(agendas);
            setContas(contasAtuais);
        } catch (falha) {
            tratarErro(falha, setErroLista);
        } finally {
            setCarregando(false);
        }
    }, [token, tratarErro]);

    useEffect(() => { void carregar(); }, [carregar]);

    useEffect(() => {
        if (!token || detalheId === undefined) return;
        let ativo = true;
        void buscarAgendamentoRequest(detalheId, token).then(
            agenda => { if (ativo) setDetalhe(agenda); },
            falha => { if (ativo) tratarErro(falha, setErro); }
        );
        return () => { ativo = false; };
    }, [detalheId, token, tratarErro]);

    function selecionar(id: number) {
        setErro("");
        setDetalhe(undefined);
        setDetalheId(id);
    }

    function fechar() {
        if (ocupado) return;
        setErro("");
        if (confirmacao) setConfirmacao(undefined);
        else if (formulario) setFormulario(undefined);
        else setDetalheId(undefined);
    }

    async function salvar(dados: AgendamentoInput) {
        if (!token || ocupado) return;
        setOcupado(true);
        setErro("");
        try {
            const agenda = await salvarAgendamentoRequest(formulario?.agenda?.id, dados, token);
            setFormulario(undefined);
            setFiltro("todos");
            setDetalhe(agenda);
            setDetalheId(agenda.id);
            await carregar();
        } catch (falha) {
            tratarErro(falha, setErro);
        } finally {
            setOcupado(false);
        }
    }

    async function confirmar() {
        if (!token || !detalhe || ocupado) return;
        setOcupado(true);
        setErro("");
        try {
            if (confirmacao === "excluir") {
                await excluirAgendamentoRequest(detalhe.id, token);
                setDetalheId(undefined);
                setDetalhe(undefined);
            } else {
                setDetalhe(await cancelarAgendamentoRequest(detalhe.id, token));
            }
            setConfirmacao(undefined);
            await carregar();
        } catch (falha) {
            tratarErro(falha, setErro);
        } finally {
            setOcupado(false);
        }
    }

    const habilitado = contas.length > 0;
    const visiveis = lista.filter(agenda => filtro === "todos" || agenda.status === filtro);
    const ativos = lista.filter(agenda => agenda.status === "ativo").length;
    const proximo = lista.map(agenda => agenda.proximoVencimento)
        .filter((data): data is string => data !== null).sort()[0];
    const hoje = dataLocal();
    return (
        <>
            <ScrollView
                contentContainerStyle={[ui.page, width >= 900 && ui.pageWide]}
                refreshControl={<RefreshControl refreshing={carregando} onRefresh={() => void carregar()} />}
            >
                <Cabecalho titulo="Agendamentos"
                    acao={<Botao label="Novo agendamento" icon="add" disabled={!habilitado} onPress={() => setFormulario({})} />} />

                <View style={styles.metrics}>
                    <View style={styles.metric}>
                        <Text style={ui.muted}>Agendamentos ativos</Text>
                        <Text style={styles.metricValue}>{carregando && !lista.length ? "—" : ativos}</Text>
                    </View>
                    <View style={styles.metric}>
                        <Text style={ui.muted}>{proximo && proximo < hoje ? "Vencimento em atraso" : "Próximo vencimento"}</Text>
                        <Text style={[styles.metricValue, proximo && proximo < hoje && styles.overdue]}>{proximo ? formatarData(proximo) : "—"}</Text>
                    </View>
                </View>

                {erroLista ? (
                    <Estado icon="alert-circle-outline" titulo="Falha ao carregar agendamentos" descricao={erroLista}
                        acao={<Botao variant="secondary" label="Tentar novamente" onPress={() => void carregar()} />} />
                ) : carregando && lista.length === 0 ? (
                    <ActivityIndicator color={colors.primary} />
                ) : (
                    <>
                        {!habilitado && (
                            <View style={[ui.card, styles.guide]}>
                                <Text style={ui.rowTitle}>Para agendar, cadastre uma conta.</Text>
                                <View style={ui.wrap}>
                                    <Botao variant="secondary" label="Ir para Contas" onPress={abrirContas} />
                                </View>
                            </View>
                        )}
                        <Escolha label="Status do agendamento" opcoes={[...filtros]} valor={filtro} selecionar={setFiltro} />
                        <View style={styles.register}>
                            {!visiveis.length ? (
                                <Estado icon="calendar-clear-outline" titulo={lista.length ? "Nenhum agendamento neste filtro" : "Nenhum agendamento cadastrado"}
                                    descricao={lista.length ? undefined : "Use Novo agendamento para criar a primeira série."} />
                            ) : visiveis.map(agenda => {
                                const status = estados[agenda.status];
                                return (
                                    <Pressable
                                        key={agenda.id}
                                        accessibilityRole="button"
                                        onPress={() => selecionar(agenda.id)}
                                        style={({ pressed }) => [
                                            ui.row, styles.agendaRow, ui.divider, pressed && styles.pressed
                                        ]}
                                    >
                                        <Ionicons name={agenda.tipo === "parcelado" ? "layers-outline" : "repeat-outline"}
                                            size={18} color={colors.primary} />
                                        <View style={ui.grow}>
                                            <Text style={ui.rowTitle}>{agenda.titulo}</Text>
                                            <Text style={ui.muted}>{resumoTipo(agenda)} · {agenda.contaNome}</Text>
                                            <View style={ui.wrap}>
                                                <Text style={[styles.status, { color: status.cor }]}>{status.label}</Text>
                                                {agenda.proximoVencimento && <Text style={ui.muted}>{formatarData(agenda.proximoVencimento)}</Text>}
                                            </View>
                                        </View>
                                        <ValorAgenda agenda={agenda} />
                                        {width >= 650 && <Ionicons name="chevron-forward" size={17} color={colors.muted} />}
                                    </Pressable>
                                );
                            })}
                        </View>
                    </>
                )}
            </ScrollView>

            {formulario ? (
                <Formulario agenda={formulario.agenda} contas={contas} ocupado={ocupado}
                    erro={erro} salvar={dados => void salvar(dados)} fechar={fechar} />
            ) : confirmacao ? (
                <Janela titulo={confirmacao === "excluir" ? "Excluir agendamento?" : "Cancelar agendamento?"} fechar={fechar}>
                    <Text style={ui.muted}>
                        {confirmacao === "excluir"
                            ? "O agendamento e seus lançamentos cancelados serão removidos."
                            : "Os vencimentos pendentes serão cancelados. Os valores já confirmados ficam no saldo e no histórico."}
                    </Text>
                    <Erro mensagem={erro} />
                    <View style={ui.wrap}>
                        <Botao label="Voltar" variant="secondary" onPress={fechar} disabled={ocupado} />
                        <Botao label={confirmacao === "excluir" ? "Excluir" : "Cancelar agendamento"} variant="danger" busy={ocupado}
                            onPress={() => void confirmar()} />
                    </View>
                </Janela>
            ) : detalheId !== undefined && (
                <Janela titulo={detalhe?.titulo ?? "Detalhes do agendamento"} fechar={fechar}>
                    <Erro mensagem={erro} />
                    {!detalhe ? (!erro && <ActivityIndicator color={colors.primary} />) : (
                        <>
                            <View style={[ui.row, styles.detailTop]}>
                                <View style={ui.grow}>
                                    <Text style={ui.rowTitle}>{resumoTipo(detalhe)}</Text>
                                    <Text style={ui.muted}>{detalhe.contaNome}</Text>
                                    <Text style={ui.muted}>{estados[detalhe.status].label} · {detalhe.pagas} confirmadas</Text>
                                </View>
                                <ValorAgenda agenda={detalhe} />
                            </View>
                            {detalhe.ate && <Text style={ui.muted}>Repetir até {formatarData(detalhe.ate)}</Text>}
                            {!!detalhe.descricao && <Text style={ui.muted}>{detalhe.descricao}</Text>}
                            <View style={ui.wrap}>
                                {detalhe.status === "ativo" && detalhe.pagas === 0 && (
                                    <Botao label="Editar" icon="create-outline" variant="secondary" onPress={() => setFormulario({ agenda: detalhe })} />
                                )}
                                {detalhe.status === "ativo" && (
                                    <Botao label="Cancelar agendamento" variant="danger" onPress={() => setConfirmacao("cancelar")} />
                                )}
                                {detalhe.status === "cancelado" && detalhe.pagas === 0 && (
                                    <Botao label="Excluir agendamento" icon="trash-outline" variant="danger" onPress={() => setConfirmacao("excluir")} />
                                )}
                            </View>
                            <Text style={ui.sectionTitle}>Vencimentos</Text>
                            <View style={ui.card}>
                                {detalhe.ocorrencias.map((item, index) => (
                                    <Pressable key={item.id} accessibilityRole="button" onPress={() => abrirTransacao(item)}
                                        style={[ui.row, styles.occurrence, index < detalhe.ocorrencias.length - 1 && ui.divider]}>
                                        <View style={ui.grow}>
                                            <Text style={ui.rowTitle}>{formatarData(item.dataInicio)}</Text>
                                            <Text style={ui.muted}>
                                                {detalhe.tipo === "parcelado" ? `Parcela ${item.numeroOcorrencia}/${detalhe.parcelas}` : `Ocorrência ${item.numeroOcorrencia}`}
                                                {" · "}{item.status === "p" ? "Confirmada" : item.status === "c" ? "Cancelada" : item.dataInicio < hoje ? "Em atraso" : "Pendente"}
                                            </Text>
                                        </View>
                                        <Text style={ui.money}>{formatarMoeda(item.valor)}</Text>
                                        <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                                    </Pressable>
                                ))}
                            </View>
                        </>
                    )}
                </Janela>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    formFields: { gap: 16 },
    formColumns: { flexDirection: "row", alignItems: "flex-start" },
    metrics: {
        flexDirection: "row", flexWrap: "wrap", columnGap: 28, rowGap: 12,
        paddingVertical: 13, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border
    },
    metric: { flexGrow: 1, flexBasis: 128, maxWidth: 245, gap: 3 },
    metricValue: { ...ui.money, color: colors.primaryDark, fontSize: 23, lineHeight: 29 },
    overdue: { color: colors.warning },
    register: { borderTopWidth: 1, borderColor: colors.control },
    guide: { gap: 10, padding: 17, backgroundColor: colors.infoSoft },
    agendaRow: { paddingVertical: 15, paddingHorizontal: 3 },
    valueColumn: { alignItems: "flex-end", flexShrink: 1, maxWidth: "43%" },
    amount: { textAlign: "right" },
    income: { color: colors.primary },
    status: { fontSize: 12, fontWeight: "700" },
    pressed: { backgroundColor: colors.selection },
    preview: { ...ui.money, padding: 11, borderRadius: 5, color: colors.primary, backgroundColor: colors.selection },
    detailTop: { borderRadius: 5, padding: 13, backgroundColor: colors.background },
    occurrence: { padding: 12 }
});
