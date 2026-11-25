import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions
} from "react-native";
import { Botao, Cabecalho, Estado, ui } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { dataLocal, formatarData, formatarMoeda } from "../formatacao";
import { ApiError, listarContasRequest, listarTransacoesRequest } from "../services/api";
import { colors, fonts } from "../theme";
import { Conta, TransacaoResumo } from "../types";

const tiposConta = {
    corrente: "Conta corrente", poupanca: "Poupança", investimento: "Investimento", carteira: "Carteira"
};
const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const diasDaPrevisao = 30;
const diasPorGrupo = 7;
const diaEmMilissegundos = 86_400_000;

function avancarData(data: string, dias: number) {
    const instante = Date.parse(data + "T00:00:00Z") + dias * diaEmMilissegundos;
    return new Date(instante).toISOString().slice(0, 10);
}

function dataCurta(iso: string) {
    const mes = Number(iso.slice(5, 7)) - 1;
    return iso.slice(8, 10) + " " + meses[mes];
}

function montarPrevisao(vencimentos: TransacaoResumo[], hoje: string) {
    const semanas = Array.from({ length: Math.ceil(diasDaPrevisao / diasPorGrupo) }, (_, indice) => ({
        inicio: avancarData(hoje, indice * diasPorGrupo),
        fim: avancarData(hoje, Math.min((indice + 1) * diasPorGrupo, diasDaPrevisao) - 1),
        receitas: 0,
        despesas: 0
    }));
    const inicio = Date.parse(hoje + "T00:00:00Z");
    let atrasados = 0;
    let receitas = 0;
    let despesas = 0;
    for (const item of vencimentos) {
        const dia = item.dataInicio.slice(0, 10);
        if (dia < hoje) {
            atrasados++;
            continue;
        }
        const indice = Math.floor((Date.parse(dia + "T00:00:00Z") - inicio) / (diasPorGrupo * diaEmMilissegundos));
        const semana = semanas[indice];
        if (!semana) continue;
        const centavos = Math.round(item.valor * 100);
        if (item.operacao === "+") {
            semana.receitas += centavos;
            receitas += centavos;
        } else {
            semana.despesas += centavos;
            despesas += centavos;
        }
    }
    return { semanas, receitas, despesas, atrasados };
}

function ResumoContas({ contas, abrirContas, compacto }: { contas: Conta[]; abrirContas: () => void; compacto: boolean }) {
    const saldo = contas.reduce((total, conta) => total + Math.round(conta.saldo * 100), 0) / 100;
    const saldoFormatado = formatarMoeda(saldo);
    const [largura, setLargura] = useState(0);
    const tamanho = largura ? Math.min(44, Math.floor(largura / (saldoFormatado.length * 0.62))) : 32;
    return (
        <View nativeID="finance-balances" style={[styles.accounts, compacto && styles.accountsCompact]}>
            <View style={styles.headerLine}>
                <Text accessibilityRole="header" style={[ui.sectionTitle, styles.onDark]}>Suas contas</Text>
                <Pressable accessibilityRole="button" onPress={abrirContas} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
                    <Text style={styles.linkOnDark}>{contas.length ? "Ver contas" : "Nova conta"}</Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.onDark} />
                </Pressable>
            </View>
            <View>
                {contas.length ? contas.slice(0, 4).map(conta => (
                    <View key={conta.id} style={[styles.accountRow, compacto && styles.accountRowCompact]}>
                        <View style={ui.grow}>
                            <Text style={[ui.rowTitle, styles.onDark]}>{conta.nome}</Text>
                            <Text style={styles.accountCaption}>{conta.instituicao ?? tiposConta[conta.tipo]}</Text>
                        </View>
                        <Text style={[ui.money, styles.accountAmount]}>{formatarMoeda(conta.saldo)}</Text>
                    </View>
                )) : (
                    <Text style={[styles.accountCaption, styles.noAccounts]}>Cadastre uma conta para acompanhar o saldo.</Text>
                )}
                {contas.length > 4 && (
                    <Text style={[styles.accountCaption, styles.moreAccounts]}>
                        {contas.length - 4} {contas.length === 5 ? "conta adicional" : "contas adicionais"} no total
                    </Text>
                )}
            </View>
            <View style={styles.total} onLayout={event => setLargura(event.nativeEvent.layout.width)}>
                <Text style={styles.totalLabel}>Saldo total</Text>
                <Text numberOfLines={1} style={[styles.totalValue, { fontSize: tamanho, lineHeight: Math.ceil(tamanho * 1.22) }]}>
                    {saldoFormatado}
                </Text>
            </View>
        </View>
    );
}

function PrevisaoCaixa({ previsao, compacta }: { previsao: ReturnType<typeof montarPrevisao>; compacta: boolean }) {
    const maximo = Math.max(1, ...previsao.semanas.flatMap(semana => [semana.receitas, semana.despesas]));
    const temPrevisao = previsao.receitas > 0 || previsao.despesas > 0;
    const altura = compacta ? 44 : 64;
    return (
        <View style={styles.forecast}>
            <View style={styles.headerLine}>
                <Text accessibilityRole="header" style={ui.sectionTitle}>Previsão de caixa</Text>
                <Text style={ui.muted}>Próximos 30 dias</Text>
            </View>
            <View style={styles.totals}>
                <View style={styles.forecastTotal}>
                    <Text style={styles.incomeCaption}>Receitas</Text>
                    <Text style={styles.forecastAmount}>+ {formatarMoeda(previsao.receitas / 100)}</Text>
                </View>
                <View style={styles.forecastTotal}>
                    <Text style={styles.expenseCaption}>Despesas</Text>
                    <Text style={styles.forecastAmount}>− {formatarMoeda(previsao.despesas / 100)}</Text>
                </View>
            </View>
            {temPrevisao ? (
                <View style={styles.chart} accessibilityLabel="Receitas acima da linha e despesas abaixo, agrupadas por semana">
                    <View style={[styles.baseline, { top: altura }]} />
                    {previsao.semanas.map(semana => (
                        <View key={semana.inicio} accessible accessibilityRole="image"
                            accessibilityLabel={[
                                dataCurta(semana.inicio) + " a " + dataCurta(semana.fim),
                                "receitas de " + formatarMoeda(semana.receitas / 100),
                                "despesas de " + formatarMoeda(semana.despesas / 100)
                            ].join(", ")}
                            style={styles.chartWeek}>
                            <View style={[styles.positive, { height: altura }]}>
                                {semana.receitas > 0 && (
                                    <View style={[styles.bar, styles.incomeBar, { height: Math.max(2, semana.receitas / maximo * (altura - 5)) }]} />
                                )}
                            </View>
                            <View style={[styles.negative, { height: altura }]}>
                                {semana.despesas > 0 && (
                                    <View style={[styles.bar, styles.expenseBar, { height: Math.max(2, semana.despesas / maximo * (altura - 5)) }]} />
                                )}
                            </View>
                            <Text style={styles.tick}>{dataCurta(semana.inicio)}</Text>
                        </View>
                    ))}
                </View>
            ) : (
                <Text style={[ui.muted, styles.forecastEmpty]}>Sem receitas ou despesas agendadas para esse período.</Text>
            )}
        </View>
    );
}

export function VisaoGeralScreen({ abrirContas, abrirAgendamentos, abrirTransacao }: {
    abrirContas: () => void;
    abrirAgendamentos: () => void;
    abrirTransacao: (transacao: TransacaoResumo) => void;
}) {
    const { token, sair } = useAuth();
    const { width } = useWindowDimensions();
    const ladoALado = width >= 920;
    const [dados, setDados] = useState<{ contas: Conta[]; vencimentos: TransacaoResumo[]; hoje: string }>();
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    const carregar = useCallback(async () => {
        if (!token) return;
        setCarregando(true);
        setErro("");
        const hoje = dataLocal();
        try {
            const [contas, pendentes] = await Promise.all([
                listarContasRequest(token),
                listarTransacoesRequest({ fim: avancarData(hoje, diasDaPrevisao - 1), status: "a", ordem: "asc" }, token)
            ]);
            setDados({ contas, vencimentos: pendentes.filter(item => item.agendamentoId !== null), hoje });
        } catch (falha) {
            if (falha instanceof ApiError && falha.status === 401) void sair();
            else setErro(falha instanceof ApiError ? falha.message : "Verifique se a API está em execução.");
        } finally {
            setCarregando(false);
        }
    }, [sair, token]);

    useEffect(() => { void carregar(); }, [carregar]);

    const hoje = dados?.hoje ?? dataLocal();
    const vencimentos = dados?.vencimentos ?? [];
    const previsao = montarPrevisao(vencimentos, hoje);
    const dataExtenso = new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeZone: "UTC" })
        .format(new Date(hoje + "T00:00:00Z"));

    return (
        <ScrollView contentContainerStyle={[ui.page, ladoALado && ui.pageWide]}
            refreshControl={<RefreshControl refreshing={carregando} onRefresh={() => void carregar()} />}>
            <Cabecalho titulo="Visão geral" subtitulo={dataExtenso}
                acao={ladoALado ? <Botao label="Ver agendamentos" icon="arrow-forward" variant="secondary" onPress={abrirAgendamentos} /> : undefined} />
            {erro ? (
                <View style={ui.card}>
                    <Estado icon="alert-circle-outline" titulo="Falha ao carregar o painel" descricao={erro}
                        acao={<Botao label="Tentar novamente" variant="secondary" onPress={() => void carregar()} />} />
                </View>
            ) : !dados && carregando ? <ActivityIndicator color={colors.primary} /> : (
                <View style={[styles.layout, ladoALado && styles.layoutWide]}>
                    <View style={[styles.accountColumn, ladoALado && styles.accountColumnWide]}>
                        <ResumoContas contas={dados?.contas ?? []} abrirContas={abrirContas} compacto={!ladoALado} />
                    </View>
                    <View style={[styles.timelineColumn, ladoALado && styles.timelineColumnWide]}>
                        <PrevisaoCaixa previsao={previsao} compacta={!ladoALado} />
                        <View>
                            <View style={[styles.headerLine, styles.statementHeader]}>
                                <Text accessibilityRole="header" style={ui.sectionTitle}>Vencimentos pendentes</Text>
                                {previsao.atrasados > 0 && <Text style={styles.overdue}>{previsao.atrasados} em atraso</Text>}
                            </View>
                            {!vencimentos.length ? (
                                <Text style={[ui.muted, styles.emptyStatement]}>Nenhum vencimento pendente nos próximos 30 dias.</Text>
                            ) : vencimentos.slice(0, 6).map(transacao => {
                                const atrasada = transacao.dataInicio < hoje;
                                const receita = transacao.operacao === "+";
                                return (
                                    <Pressable key={transacao.id} accessibilityRole="button"
                                        accessibilityLabel={[
                                            transacao.titulo, "vencimento em " + formatarData(transacao.dataInicio),
                                            receita ? "receita" : "despesa", formatarMoeda(transacao.valor),
                                            atrasada ? "em atraso" : "pendente"
                                        ].join(", ")}
                                        onPress={() => abrirTransacao(transacao)}
                                        style={({ pressed }) => [styles.statementRow, pressed && styles.pressedRow]}>
                                        <View style={styles.dueDate}>
                                            <Text style={[styles.dueDay, atrasada && styles.overdueColor]}>{transacao.dataInicio.slice(8, 10)}</Text>
                                            <Text style={[styles.dueMonth, atrasada && styles.overdueColor]}>
                                                {meses[Number(transacao.dataInicio.slice(5, 7)) - 1]}
                                            </Text>
                                        </View>
                                        <View style={ui.grow}>
                                            <Text style={ui.rowTitle}>{transacao.titulo}</Text>
                                            <Text style={ui.muted}>{transacao.contaNome} · {transacao.categoriaNome}</Text>
                                        </View>
                                        <Text style={[ui.money, receita && styles.incomeCaption, styles.statementAmount]}>
                                            {receita ? "+" : "−"} {formatarMoeda(transacao.valor)}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                            {vencimentos.length > 6 && (
                                <Pressable accessibilityRole="button" onPress={abrirAgendamentos} style={styles.link}>
                                    <Text style={styles.listLink}>Ver mais vencimentos</Text>
                                    <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                                </Pressable>
                            )}
                        </View>
                    </View>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    layout: { gap: 27 },
    layoutWide: { flexDirection: "row", alignItems: "flex-start", gap: 40 },
    accountColumn: { minWidth: 0 },
    accountColumnWide: { flex: 0.75, minWidth: 310 },
    timelineColumn: { minWidth: 0, gap: 27 },
    timelineColumnWide: { flex: 1.25 },
    accounts: { backgroundColor: colors.primary, padding: 20, gap: 15, borderRadius: 6 },
    accountsCompact: { padding: 16, gap: 10 },
    headerLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 },
    onDark: { color: colors.onDark },
    link: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", minHeight: 44, gap: 8 },
    linkOnDark: { color: colors.onDark, fontWeight: "700", fontSize: 13 },
    pressed: { opacity: 0.78 },
    accountRow: {
        minHeight: 57, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8,
        borderBottomWidth: 1, borderColor: colors.dividerOnDark
    },
    accountRowCompact: { minHeight: 50, paddingVertical: 5 },
    accountCaption: { color: colors.mutedOnDark, fontSize: 13, lineHeight: 19 },
    accountAmount: { color: colors.onDark, flexShrink: 1, textAlign: "right" },
    noAccounts: { minHeight: 46, paddingTop: 5 },
    moreAccounts: { paddingTop: 10 },
    total: { gap: 2, paddingTop: 4 },
    totalLabel: { color: colors.mutedOnDark, fontSize: 14, fontWeight: "600" },
    totalValue: { color: colors.onDark, fontFamily: fonts.numbers, letterSpacing: -0.9 },
    forecast: { gap: 13 },
    totals: { flexDirection: "row", flexWrap: "wrap", columnGap: 27, rowGap: 8 },
    forecastTotal: { flexShrink: 1, gap: 2 },
    forecastAmount: { color: colors.text, fontFamily: fonts.numbers, fontSize: 18, lineHeight: 26 },
    incomeCaption: { color: colors.primary, fontWeight: "600", fontSize: 13 },
    expenseCaption: { color: colors.expense, fontWeight: "600", fontSize: 13 },
    chart: { position: "relative", flexDirection: "row" },
    chartWeek: { flex: 1, minWidth: 0, alignItems: "center" },
    positive: { justifyContent: "flex-end", alignItems: "center" },
    negative: { justifyContent: "flex-start", alignItems: "center" },
    baseline: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: colors.control },
    bar: { width: 22, minHeight: 2 },
    incomeBar: { backgroundColor: colors.primary },
    expenseBar: { backgroundColor: colors.expense },
    tick: { fontSize: 11, lineHeight: 19, color: colors.muted, fontFamily: fonts.numbers },
    forecastEmpty: { paddingVertical: 14 },
    statementHeader: { paddingBottom: 12, borderBottomWidth: 1, borderColor: colors.control },
    statementRow: {
        minHeight: 61, flexDirection: "row", alignItems: "center", gap: 12,
        paddingVertical: 8, borderBottomWidth: 1, borderColor: colors.border
    },
    dueDate: { width: 42, alignItems: "center", borderRightWidth: 1, borderColor: colors.border, paddingRight: 8 },
    dueDay: { color: colors.primaryDark, fontFamily: fonts.numbers, fontSize: 18, lineHeight: 23 },
    dueMonth: { color: colors.muted, fontSize: 11, lineHeight: 15 },
    overdue: { color: colors.warning, fontSize: 13, fontWeight: "700" },
    overdueColor: { color: colors.warning },
    emptyStatement: { paddingVertical: 18 },
    statementAmount: { maxWidth: "43%", textAlign: "right" },
    pressedRow: { backgroundColor: colors.selection },
    listLink: { color: colors.primary, fontWeight: "700", fontSize: 13 }
});
