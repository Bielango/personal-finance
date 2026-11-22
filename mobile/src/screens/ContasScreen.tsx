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
    atualizarContaRequest,
    criarContaRequest,
    excluirContaRequest,
    listarContasRequest
} from "../services/api";
import { colors } from "../theme";
import { Conta, TipoConta } from "../types";

const tiposConta = [
    { valor: "corrente" as const, label: "Corrente", icon: "card-outline" as const },
    { valor: "poupanca" as const, label: "Poupanca", icon: "save-outline" as const },
    { valor: "investimento" as const, label: "Investimento", icon: "trending-up-outline" as const },
    { valor: "carteira" as const, label: "Carteira", icon: "wallet-outline" as const }
];

function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function detalhesDoTipo(tipo: TipoConta) {
    return tiposConta.find(item => item.valor === tipo) ?? tiposConta[0]!;
}

function converterSaldo(valor: string) {
    const normalizado = valor.trim().replace(/\s/g, "").replace(",", ".");
    if (!normalizado) return null;
    const numero = Number(normalizado);
    return Number.isFinite(numero) ? numero : null;
}

export function ContasScreen() {
    const { token, sair } = useAuth();
    const [contas, setContas] = useState<Conta[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [erroLista, setErroLista] = useState("");
    const [modalVisivel, setModalVisivel] = useState(false);
    const [contaEditando, setContaEditando] = useState<Conta | null>(null);
    const [nome, setNome] = useState("");
    const [instituicao, setInstituicao] = useState("");
    const [tipo, setTipo] = useState<TipoConta>("corrente");
    const [saldo, setSaldo] = useState("");
    const [salvando, setSalvando] = useState(false);
    const [erroFormulario, setErroFormulario] = useState("");

    const saldoTotal = useMemo(
        () => contas.reduce((total, conta) => total + conta.saldo, 0),
        [contas]
    );

    const carregarContas = useCallback(async (refresh = false) => {
        if (!token) return;

        refresh ? setAtualizando(true) : setCarregando(true);
        setErroLista("");
        try {
            setContas(await listarContasRequest(token));
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
                await sair();
                return;
            }
            setErroLista(
                error instanceof ApiError
                    ? error.message
                    : "Nao foi possivel carregar as contas."
            );
        } finally {
            setCarregando(false);
            setAtualizando(false);
        }
    }, [token, sair]);

    useEffect(() => {
        void carregarContas();
    }, [carregarContas]);

    function abrirNovaConta() {
        setContaEditando(null);
        setNome("");
        setInstituicao("");
        setTipo("corrente");
        setSaldo("");
        setErroFormulario("");
        setModalVisivel(true);
    }

    function abrirEdicao(conta: Conta) {
        setContaEditando(conta);
        setNome(conta.nome);
        setInstituicao(conta.instituicao ?? "");
        setTipo(conta.tipo);
        setSaldo(String(conta.saldo).replace(".", ","));
        setErroFormulario("");
        setModalVisivel(true);
    }

    function fecharFormulario() {
        if (!salvando) setModalVisivel(false);
    }

    async function salvar() {
        if (!token) return;

        const saldoNumerico = converterSaldo(saldo);
        if (!nome.trim() || saldoNumerico === null) {
            setErroFormulario("Informe o nome e um saldo valido.");
            return;
        }

        const dados = {
            nome: nome.trim(),
            ...(instituicao.trim() ? { instituicao: instituicao.trim() } : {}),
            tipo,
            saldo: saldoNumerico
        };

        setSalvando(true);
        setErroFormulario("");
        try {
            if (contaEditando) {
                await atualizarContaRequest(contaEditando.id, dados, token);
            } else {
                await criarContaRequest(dados, token);
            }
            setModalVisivel(false);
            await carregarContas();
        } catch (error) {
            setErroFormulario(
                error instanceof ApiError
                    ? error.message
                    : "Nao foi possivel salvar a conta."
            );
        } finally {
            setSalvando(false);
        }
    }

    async function executarExclusao(conta: Conta) {
        if (!token) return;
        try {
            await excluirContaRequest(conta.id, token);
            await carregarContas();
        } catch (error) {
            const mensagem = error instanceof ApiError
                ? error.message
                : "Nao foi possivel excluir a conta.";
            if (Platform.OS === "web") {
                globalThis.alert(mensagem);
            } else {
                Alert.alert("Erro", mensagem);
            }
        }
    }

    function confirmarExclusao(conta: Conta) {
        const mensagem = `Deseja excluir a conta ${conta.nome}?`;

        if (Platform.OS === "web") {
            if (globalThis.confirm(mensagem)) void executarExclusao(conta);
            return;
        }

        Alert.alert("Excluir conta", mensagem, [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Excluir",
                style: "destructive",
                onPress: () => void executarExclusao(conta)
            }
        ]);
    }

    function renderConta({ item }: { item: Conta }) {
        const detalhes = detalhesDoTipo(item.tipo);

        return (
            <View style={styles.accountItem}>
                <View style={styles.accountIcon}>
                    <Ionicons name={detalhes.icon} size={22} color={colors.info} />
                </View>
                <View style={styles.accountInfo}>
                    <Text numberOfLines={1} style={styles.accountName}>{item.nome}</Text>
                    <Text numberOfLines={1} style={styles.accountDetails}>
                        {item.instituicao || "Sem instituicao"} · {detalhes.label}
                    </Text>
                    <Text
                        numberOfLines={1}
                        style={[styles.accountBalance, item.saldo < 0 && styles.negativeBalance]}
                    >
                        {formatarMoeda(item.saldo)}
                    </Text>
                </View>
                <View style={styles.actions}>
                    <Pressable
                        accessibilityLabel={`Editar ${item.nome}`}
                        onPress={() => abrirEdicao(item)}
                        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                    >
                        <Ionicons name="pencil-outline" size={20} color={colors.info} />
                    </Pressable>
                    <Pressable
                        accessibilityLabel={`Excluir ${item.nome}`}
                        onPress={() => confirmarExclusao(item)}
                        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                    >
                        <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <View style={styles.titleRow}>
                <View>
                    <Text style={styles.title}>Contas</Text>
                    <Text style={styles.count}>{contas.length} cadastrada(s)</Text>
                </View>
                <Pressable
                    accessibilityLabel="Adicionar conta"
                    onPress={abrirNovaConta}
                    style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
                >
                    <Ionicons name="add" size={22} color="#FFFFFF" />
                    <Text style={styles.addText}>Adicionar</Text>
                </Pressable>
            </View>

            <View style={styles.totalBand}>
                <Text style={styles.totalLabel}>SALDO TOTAL</Text>
                <Text style={[styles.totalValue, saldoTotal < 0 && styles.negativeBalance]}>
                    {formatarMoeda(saldoTotal)}
                </Text>
            </View>

            {carregando ? (
                <View style={styles.centerState}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : erroLista ? (
                <View style={styles.centerState}>
                    <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
                    <Text style={styles.errorStateText}>{erroLista}</Text>
                    <Pressable onPress={() => void carregarContas()} style={styles.retryButton}>
                        <Text style={styles.retryText}>Tentar novamente</Text>
                    </Pressable>
                </View>
            ) : (
                <FlatList
                    data={contas}
                    keyExtractor={item => String(item.id)}
                    renderItem={renderConta}
                    contentContainerStyle={contas.length ? styles.list : styles.emptyList}
                    refreshControl={
                        <RefreshControl
                            refreshing={atualizando}
                            onRefresh={() => void carregarContas(true)}
                            colors={[colors.primary]}
                            tintColor={colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.centerState}>
                            <Ionicons name="wallet-outline" size={38} color={colors.info} />
                            <Text style={styles.emptyTitle}>Nenhuma conta cadastrada</Text>
                        </View>
                    }
                />
            )}

            <Modal
                animationType="slide"
                transparent
                visible={modalVisivel}
                onRequestClose={() => {
                    if (!salvando) fecharFormulario();
                }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    style={styles.modalOverlay}
                >
                    <Pressable style={styles.modalDismissArea} onPress={fecharFormulario} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {contaEditando ? "Editar conta" : "Nova conta"}
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
                            <View style={styles.group}>
                                <Text style={styles.label}>Nome da conta</Text>
                                <TextInput
                                    value={nome}
                                    onChangeText={setNome}
                                    placeholder="Ex.: Conta principal"
                                    placeholderTextColor="#87928F"
                                    style={styles.input}
                                />
                            </View>

                            <View style={styles.group}>
                                <Text style={styles.label}>Instituicao (opcional)</Text>
                                <TextInput
                                    value={instituicao}
                                    onChangeText={setInstituicao}
                                    placeholder="Ex.: Nubank"
                                    placeholderTextColor="#87928F"
                                    style={styles.input}
                                />
                            </View>

                            <View style={styles.group}>
                                <Text style={styles.label}>Tipo</Text>
                                <View style={styles.typeOptions}>
                                    {tiposConta.map(item => {
                                        const selecionado = tipo === item.valor;
                                        return (
                                            <Pressable
                                                key={item.valor}
                                                accessibilityRole="radio"
                                                accessibilityState={{ checked: selecionado }}
                                                onPress={() => setTipo(item.valor)}
                                                style={({ pressed }) => [
                                                    styles.typeOption,
                                                    selecionado && styles.selectedType,
                                                    pressed && styles.pressed
                                                ]}
                                            >
                                                <Ionicons
                                                    name={selecionado ? "radio-button-on" : "radio-button-off"}
                                                    size={19}
                                                    color={selecionado ? colors.primary : colors.muted}
                                                />
                                                <Text
                                                    numberOfLines={1}
                                                    style={[
                                                        styles.typeText,
                                                        selecionado && styles.selectedTypeText
                                                    ]}
                                                >
                                                    {item.label}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>

                            <View style={styles.group}>
                                <Text style={styles.label}>Saldo</Text>
                                <View style={styles.moneyField}>
                                    <Text style={styles.currencyPrefix}>R$</Text>
                                    <TextInput
                                        value={saldo}
                                        onChangeText={setSaldo}
                                        placeholder="0,00"
                                        placeholderTextColor="#87928F"
                                        keyboardType="decimal-pad"
                                        style={styles.moneyInput}
                                        onSubmitEditing={() => void salvar()}
                                    />
                                </View>
                            </View>

                            {!!erroFormulario && (
                                <View style={styles.errorBox}>
                                    <Ionicons name="alert-circle-outline" size={19} color={colors.danger} />
                                    <Text style={styles.errorText}>{erroFormulario}</Text>
                                </View>
                            )}

                            <Pressable
                                disabled={salvando}
                                onPress={() => void salvar()}
                                style={({ pressed }) => [
                                    styles.saveButton,
                                    pressed && styles.pressed,
                                    salvando && styles.disabled
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
    totalBand: {
        minHeight: 92,
        paddingHorizontal: 18,
        justifyContent: "center",
        backgroundColor: colors.infoSoft,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    totalLabel: {
        color: colors.info,
        fontSize: 11,
        fontWeight: "800"
    },
    totalValue: {
        color: colors.text,
        fontSize: 28,
        fontWeight: "800",
        marginTop: 4
    },
    negativeBalance: {
        color: colors.danger
    },
    list: {
        padding: 14,
        gap: 10
    },
    emptyList: {
        flexGrow: 1
    },
    accountItem: {
        minHeight: 88,
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
    accountIcon: {
        width: 44,
        height: 44,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.infoSoft
    },
    accountInfo: {
        flex: 1,
        minWidth: 0
    },
    accountName: {
        color: colors.text,
        fontSize: 15,
        fontWeight: "800"
    },
    accountDetails: {
        color: colors.muted,
        fontSize: 12,
        marginTop: 3
    },
    accountBalance: {
        color: colors.text,
        fontSize: 15,
        fontWeight: "700",
        marginTop: 5
    },
    actions: {
        alignItems: "center",
        justifyContent: "center"
    },
    iconButton: {
        width: 38,
        height: 34,
        alignItems: "center",
        justifyContent: "center"
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
        justifyContent: "space-between"
    },
    modalTitle: {
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
    typeOptions: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8
    },
    typeOption: {
        width: "48%",
        minHeight: 44,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 6,
        flexDirection: "row",
        alignItems: "center",
        gap: 7
    },
    selectedType: {
        borderColor: colors.primary,
        backgroundColor: "#EDF6F4"
    },
    typeText: {
        flexShrink: 1,
        color: colors.muted,
        fontSize: 13,
        fontWeight: "600"
    },
    selectedTypeText: {
        color: colors.primary,
        fontWeight: "800"
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
