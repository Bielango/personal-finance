import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import {
    Botao, Cabecalho, Campo, Carregando, Confirmacao, Erro, Escolha, Estado, Etiqueta, FiltroStatus,
    Icone, Indicadores, Janela, ListaRegistros, Registro, Seletor, ui, Valor
} from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { converterData, converterValor, dataLocal, descreverOrigem, formatarData, formatarMoeda } from "../formatacao";
import {
    AgendamentoInput, ApiError, buscarAgendamentoRequest, cancelarAgendamentoRequest, excluirAgendamentoRequest,
    listarAgendamentosRequest, listarContasRequest, salvarAgendamentoRequest
} from "../services/api";
import { colors, layout } from "../theme";
import { Agendamento, AgendamentoDetalhe, Conta, OperacaoTransacao, Periodicidade, TransacaoResumo } from "../types";

const frequencias: { valor: Periodicidade; label: string }[] = [
    { valor: "semanal", label: "Semanal" }, { valor: "mensal", label: "Mensal" }, { valor: "anual", label: "Anual" }
];
const estados = { ativo: "Ativo", concluido: "Concluído", cancelado: "Cancelado" };
const filtros = [
    { valor: "todos", label: "Todos" },
    { valor: "ativo", label: "Ativos" },
    { valor: "concluido", label: "Concluídos" },
    { valor: "cancelado", label: "Cancelados" }
] as const;
type Filtro = typeof filtros[number]["valor"];

function resumoTipo(agenda: Agendamento) {
    return agenda.tipo === "parcelado"
        ? agenda.parcelas + " parcelas mensais"
        : "Recorrente · " + agenda.periodicidade;
}

function ValorAgenda({ agenda }: { agenda: Agendamento }) {
    return (
        <View style={ui.recordEnd}>
            <Valor valor={agenda.valor} operacao={agenda.operacao} cor={agenda.operacao === "-" ? colors.expense : undefined} />
            <Text style={[ui.muted, styles.valor]}>{agenda.tipo === "parcelado" ? "valor total" : "por ocorrência"}</Text>
        </View>
    );
}

function FormularioAgenda({ agenda, contas, ocupado, erro, salvar, fechar }: {
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
    const [contaId, setConta] = useState(agenda?.contaId ?? contas[0]?.id ?? null);
    const [contasAbertas, setContasAbertas] = useState(false);
    const [erroLocal, setErroLocal] = useState("");
    const valorNumerico = converterValor(valor);
    const totalParcelas = Number(parcelas);
    const centavos = Math.round((valorNumerico ?? 0) * 100);
    const mostrarPrevia = tipo === "parcelado" && Number.isInteger(totalParcelas)
        && totalParcelas >= 2 && totalParcelas <= 120 && centavos >= totalParcelas;
    const base = Math.floor(centavos / Math.max(totalParcelas, 1));
    const resto = centavos % totalParcelas;

    function enviar() {
        if (ocupado) return;
        if (!contaId || !valorNumerico || valorNumerico < 0 || titulo.trim().length < 2) {
            setErroLocal("Informe o título, a conta e um valor maior que zero.");
            return;
        }

        setErroLocal("");
        const comum = { contaId, titulo, descricao, valor: valorNumerico, operacao, primeiroVencimento: converterData(primeiro) };
        salvar(tipo === "parcelado"
            ? { ...comum, tipo, parcelas: totalParcelas }
            : { ...comum, tipo, periodicidade: frequencia, ate: ate.trim() ? converterData(ate) : undefined });
    }

    return (
        <Janela titulo={agenda ? "Editar agendamento" : "Novo agendamento"} fechar={fechar} ocupada={ocupado} rodape={
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
                        { valor: "-", label: "Despesa", icon: "arrow-up-outline" },
                        { valor: "+", label: "Receita", icon: "arrow-down-outline" }
                    ]} />
                </View>
            </View>
            <Campo label="Título" value={titulo} onChangeText={setTitulo} maxLength={100} placeholder={operacao === "+" ? "Ex.: Salário" : "Ex.: Equipamento"} />
            <View style={[styles.formFields, width >= 720 && styles.formColumns]}>
                <View style={ui.grow}>
                    <Campo label={tipo === "parcelado" ? "Valor total (R$)" : "Valor por ocorrência (R$)"}
                        value={valor} onChangeText={setValor} keyboardType="decimal-pad" placeholder="0,00" />
                </View>
                <View style={ui.grow}>
                    <Campo label="Primeiro vencimento" value={primeiro} onChangeText={setPrimeiro} placeholder="DD/MM/AAAA" maxLength={10} />
                </View>
            </View>
            {tipo === "parcelado" ? (
                <>
                    <Campo label="Número de parcelas mensais" value={parcelas} onChangeText={setParcelas} keyboardType="number-pad" maxLength={3} />
                    {mostrarPrevia && (
                        <Text accessibilityLiveRegion="polite" style={styles.preview}>
                            {resto > 0
                                ? resto + " × " + formatarMoeda((base + 1) / 100) + " + " + (totalParcelas - resto) + " × " + formatarMoeda(base / 100)
                                : totalParcelas + " × " + formatarMoeda(base / 100)}
                        </Text>
                    )}
                </>
            ) : (
                <>
                    <Escolha label="Frequência" valor={frequencia} selecionar={setFrequencia} opcoes={frequencias} />
                    <Campo label="Repetir até (opcional)" value={ate} onChangeText={setAte} placeholder="DD/MM/AAAA" maxLength={10} />
                </>
            )}
            <Seletor label="Conta" valor={contaId} selecionar={id => { setConta(id); setContasAbertas(false); }}
                aberto={contasAbertas} alternar={() => setContasAbertas(!contasAbertas)}
                opcoes={contas.map(conta => ({ valor: conta.id, label: conta.nome, descricao: formatarMoeda(conta.saldo), icon: "wallet-outline" }))} />
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
    const [lista, setLista] = useState<Agendamento[]>([]);
    const [contas, setContas] = useState<Conta[]>([]);
    const [filtro, setFiltro] = useState<Filtro>("todos");
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
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

    const carregar = useCallback(async (refresh = false) => {
        if (!token) return;
        refresh ? setAtualizando(true) : setCarregando(true);
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
            setAtualizando(false);
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
            await carregar(true);
        } catch (falha) {
            tratarErro(falha, setErro);
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
                await excluirAgendamentoRequest(detalhe.id, token);
                setDetalheId(undefined);
                setDetalhe(undefined);
            } else {
                setDetalhe(await cancelarAgendamentoRequest(detalhe.id, token));
            }
            setConfirmacao(undefined);
            await carregar(true);
        } catch (falha) {
            tratarErro(falha, setErro);
        } finally {
            setOcupado(false);
        }
    }

    const visiveis = lista.filter(agenda => filtro === "todos" || agenda.status === filtro);
    const ativos = lista.filter(agenda => agenda.status === "ativo").length;
    const proximo = lista.map(agenda => agenda.proximoVencimento)
        .filter((data): data is string => data !== null).sort()[0];
    const hoje = dataLocal();
    const atrasado = !!proximo && proximo < hoje;
    const semTotais = carregando || !!erroLista;
    const excluindo = confirmacao === "excluir";

    return (
        <>
            <ListaRegistros dados={visiveis} carregando={carregando} atualizando={atualizando} erro={erroLista}
                carregar={() => void carregar(true)}
                vazio={<Estado icon="calendar-outline" titulo={lista.length ? "Nenhum agendamento com este status" : "Nenhum agendamento cadastrado"} />}
                cabecalho={
                    <>
                        <Cabecalho titulo="Agendamentos" acao={<Botao label="Novo agendamento" icon="add"
                            disabled={!contas.length || carregando || !!erroLista}
                            onPress={() => { setErro(""); setFormulario({}); }} />} />
                        <Indicadores itens={[
                            { label: "Agendamentos ativos", valor: semTotais ? "—" : String(ativos) },
                            { label: atrasado ? "Vencimento em atraso" : "Próximo vencimento",
                                valor: proximo && !semTotais ? formatarData(proximo) : "—", cor: atrasado ? colors.warning : undefined }
                        ]} />
                        {!contas.length && !semTotais && (
                            <View style={ui.wrap}>
                                <Text style={ui.muted}>Cadastre uma conta para criar um agendamento.</Text>
                                <Botao variant="secondary" label="Ir para Contas" onPress={abrirContas} />
                            </View>
                        )}
                        <FiltroStatus opcoes={filtros} valor={filtro} selecionar={setFiltro} />
                    </>
                }
                renderItem={({ item }) => (
                    <Registro abrir={() => selecionar(item.id)} label={"Abrir " + item.titulo}
                        inicio={<Icone icon={item.tipo === "parcelado" ? "layers-outline" : "repeat-outline"} />}
                        fim={<ValorAgenda agenda={item} />}>
                        <Text style={ui.rowTitle}>{item.titulo}</Text>
                        <Text style={ui.muted}>{resumoTipo(item)} · {item.contaNome}</Text>
                        <View style={[ui.wrap, styles.status]}>
                            <Etiqueta label={estados[item.status]} tom={item.status === "concluido" ? "success" : "neutral"} />
                            {item.proximoVencimento && (
                                <Text style={[ui.muted, item.proximoVencimento < hoje && styles.atrasado]}>{formatarData(item.proximoVencimento)}</Text>
                            )}
                        </View>
                    </Registro>
                )} />

            {formulario ? (
                <FormularioAgenda agenda={formulario.agenda} contas={contas} ocupado={ocupado}
                    erro={erro} salvar={dados => void salvar(dados)} fechar={fechar} />
            ) : confirmacao ? (
                <Confirmacao titulo={excluindo ? "Excluir agendamento?" : "Cancelar agendamento?"}
                    mensagem={excluindo
                        ? "O agendamento e os lançamentos cancelados serão removidos."
                        : "Os vencimentos pendentes serão cancelados. Os valores confirmados permanecem no saldo e no histórico."}
                    label={excluindo ? "Excluir agendamento" : "Cancelar agendamento"}
                    fechar={fechar} confirmar={() => void confirmar()} erro={erro} busy={ocupado} />
            ) : detalheId !== undefined && (
                <Janela titulo={detalhe?.titulo ?? "Detalhes do agendamento"} fechar={fechar} ocupada={ocupado}>
                    <Erro mensagem={erro} />
                    {!detalhe ? (!erro && <Carregando />) : (
                        <>
                            <View style={styles.detalheResumo}>
                                <View style={ui.grow}>
                                    <Text style={ui.rowTitle}>{resumoTipo(detalhe)}</Text>
                                    <Text style={ui.muted}>{detalhe.contaNome}</Text>
                                    <View style={[ui.wrap, styles.status]}>
                                        <Etiqueta label={estados[detalhe.status]} tom={detalhe.status === "concluido" ? "success" : "neutral"} />
                                        <Text style={ui.muted}>{detalhe.pagas} confirmadas</Text>
                                    </View>
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
                            <View>
                                <Text accessibilityRole="header" style={ui.sectionTitle}>Vencimentos</Text>
                                {detalhe.ocorrencias.map(item => {
                                    const vencido = item.status === "a" && item.dataInicio.slice(0, 10) < hoje;
                                    const status = item.status === "p" ? "Confirmada" : item.status === "c" ? "Cancelada" : vencido ? "Em atraso" : "Pendente";
                                    return (
                                        <Registro key={item.id} abrir={() => abrirTransacao(item)} fim={<Text style={ui.money}>{formatarMoeda(item.valor)}</Text>}>
                                            <Text style={ui.rowTitle}>{formatarData(item.dataInicio)}</Text>
                                            <View style={ui.wrap}>
                                                <Text style={ui.muted}>{descreverOrigem(item)}</Text>
                                                <Etiqueta label={status} tom={vencido ? "warning" : item.status === "p" ? "success" : "neutral"} />
                                            </View>
                                        </Registro>
                                    );
                                })}
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
    valor: { textAlign: "right" },
    atrasado: { color: colors.warning },
    status: { gap: 6, marginTop: 3 },
    preview: { ...ui.money, padding: 10, borderRadius: layout.controlRadius, backgroundColor: colors.selection },
    detalheResumo: { ...ui.row, borderRadius: layout.controlRadius, padding: 12, backgroundColor: colors.infoSoft }
});
