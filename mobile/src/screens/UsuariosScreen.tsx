import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
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
import { Botao, Cabecalho } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import {
    ApiError,
    atualizarUsuarioRequest,
    criarUsuarioRequest,
    excluirUsuarioRequest,
    listarUsuariosRequest
} from "../services/api";
import { colors } from "../theme";
import { Usuario } from "../types";

export function UsuariosScreen() {
    const { token, usuario: usuarioAtual, atualizarUsuarioLocal, sair } = useAuth();
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [erroLista, setErroLista] = useState("");
    const [modalVisivel, setModalVisivel] = useState(false);
    const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [erroFormulario, setErroFormulario] = useState("");

    const carregarUsuarios = useCallback(async (refresh = false) => {
        if (!token) return;

        refresh ? setAtualizando(true) : setCarregando(true);
        setErroLista("");
        try {
            setUsuarios(await listarUsuariosRequest(token));
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
                await sair();
                return;
            }
            setErroLista(
                error instanceof ApiError
                    ? error.message
                    : "Nao foi possivel carregar os usuarios."
            );
        } finally {
            setCarregando(false);
            setAtualizando(false);
        }
    }, [token, sair]);

    useEffect(() => {
        void carregarUsuarios();
    }, [carregarUsuarios]);

    function abrirNovo() {
        setUsuarioEditando(null);
        setNome("");
        setEmail("");
        setSenha("");
        setMostrarSenha(false);
        setErroFormulario("");
        setModalVisivel(true);
    }

    function abrirEdicao(usuario: Usuario) {
        setUsuarioEditando(usuario);
        setNome(usuario.nome);
        setEmail(usuario.email);
        setSenha("");
        setMostrarSenha(false);
        setErroFormulario("");
        setModalVisivel(true);
    }

    function fecharFormulario() {
        if (!salvando) setModalVisivel(false);
    }

    async function salvar() {
        if (!token) return;
        if (!nome.trim() || !email.trim() || (!usuarioEditando && !senha)) {
            setErroFormulario("Preencha todos os campos obrigatorios.");
            return;
        }

        setSalvando(true);
        setErroFormulario("");
        try {
            if (usuarioEditando) {
                const atualizado = await atualizarUsuarioRequest(
                    usuarioEditando.id,
                    {
                        nome: nome.trim(),
                        email: email.trim(),
                        ...(senha ? { senha } : {})
                    },
                    token
                );
                if (atualizado.id === usuarioAtual?.id) {
                    await atualizarUsuarioLocal(atualizado);
                }
            } else {
                await criarUsuarioRequest({
                    nome: nome.trim(),
                    email: email.trim(),
                    senha
                }, token);
            }

            setModalVisivel(false);
            await carregarUsuarios();
        } catch (error) {
            setErroFormulario(
                error instanceof ApiError
                    ? error.message
                    : "Nao foi possivel salvar o usuario."
            );
        } finally {
            setSalvando(false);
        }
    }

    async function executarExclusao(usuario: Usuario) {
        if (!token) return;
        try {
            await excluirUsuarioRequest(usuario.id, token);
            await carregarUsuarios();
        } catch (error) {
            const mensagem = error instanceof ApiError
                ? error.message
                : "Nao foi possivel excluir o usuario.";
            if (Platform.OS === "web") {
                globalThis.alert(mensagem);
            } else {
                Alert.alert("Erro", mensagem);
            }
        }
    }

    function confirmarExclusao(usuario: Usuario) {
        const mensagem = `Excluir ${usuario.nome}? As contas vinculadas tambem serao excluidas.`;

        if (Platform.OS === "web") {
            if (globalThis.confirm(mensagem)) void executarExclusao(usuario);
            return;
        }

        Alert.alert("Excluir usuario", mensagem, [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Excluir",
                style: "destructive",
                onPress: () => void executarExclusao(usuario)
            }
        ]);
    }

    function renderUsuario({ item }: { item: Usuario }) {
        const proprioUsuario = item.id === usuarioAtual?.id;

        return (
            <View style={styles.userItem}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.nome.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.userInfo}>
                    <View style={styles.nameLine}>
                        <Text numberOfLines={1} style={styles.userName}>{item.nome}</Text>
                        {proprioUsuario && <Text style={styles.currentText}>voce</Text>}
                    </View>
                    <Text numberOfLines={1} style={styles.userEmail}>{item.email}</Text>
                </View>
                <Pressable
                    accessibilityLabel={`Editar ${item.nome}`}
                    hitSlop={4}
                    onPress={() => abrirEdicao(item)}
                    style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                >
                    <Ionicons name="pencil-outline" size={20} color={colors.info} />
                </Pressable>
                {!proprioUsuario && (
                    <Pressable
                        accessibilityLabel={`Excluir ${item.nome}`}
                        hitSlop={4}
                        onPress={() => confirmarExclusao(item)}
                        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                    >
                        <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    </Pressable>
                )}
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <View style={styles.titleRow}>
                <Cabecalho titulo="Usuários" subtitulo="Gerencie quem pode acessar o sistema."
                    acao={<Botao label="Novo usuário" icon="person-add-outline" onPress={abrirNovo} />} />
            </View>

            {carregando ? (
                <View style={styles.centerState}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : erroLista ? (
                <View style={styles.centerState}>
                    <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
                    <Text style={styles.errorStateText}>{erroLista}</Text>
                    <Pressable onPress={() => void carregarUsuarios()} style={styles.retryButton}>
                        <Text style={styles.retryText}>Tentar novamente</Text>
                    </Pressable>
                </View>
            ) : (
                <FlatList
                    data={usuarios}
                    keyExtractor={item => String(item.id)}
                    renderItem={renderUsuario}
                    contentContainerStyle={usuarios.length ? styles.list : styles.emptyList}
                    refreshControl={
                        <RefreshControl
                            refreshing={atualizando}
                            onRefresh={() => void carregarUsuarios(true)}
                            colors={[colors.primary]}
                            tintColor={colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.centerState}>
                            <Ionicons name="people-outline" size={38} color={colors.info} />
                            <Text style={styles.emptyTitle}>Nenhum usuario cadastrado</Text>
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
                                {usuarioEditando ? "Editar usuario" : "Novo usuario"}
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
                                <Text style={styles.label}>Nome</Text>
                                <TextInput
                                    value={nome}
                                    onChangeText={setNome}
                                    placeholder="Nome completo"
                                    placeholderTextColor={colors.muted}
                                    autoCapitalize="words"
                                    style={styles.input}
                                />
                            </View>

                            <View style={styles.group}>
                                <Text style={styles.label}>Email</Text>
                                <TextInput
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="usuario@email.com"
                                    placeholderTextColor={colors.muted}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    style={styles.input}
                                />
                            </View>

                            <View style={styles.group}>
                                <Text style={styles.label}>
                                    Senha{usuarioEditando ? " (opcional)" : ""}
                                </Text>
                                <View style={styles.passwordField}>
                                    <TextInput
                                        value={senha}
                                        onChangeText={setSenha}
                                        placeholder={
                                            usuarioEditando
                                                ? "Deixe vazio para manter"
                                                : "Minimo de 6 caracteres"
                                        }
                                        placeholderTextColor={colors.muted}
                                        secureTextEntry={!mostrarSenha}
                                        autoCapitalize="none"
                                        style={styles.passwordInput}
                                    />
                                    <Pressable
                                        accessibilityLabel={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                                        onPress={() => setMostrarSenha(value => !value)}
                                        style={({ pressed }) => [styles.eyeButton, pressed && styles.pressed]}
                                    >
                                        <Ionicons
                                            name={mostrarSenha ? "eye-off-outline" : "eye-outline"}
                                            size={21}
                                            color={colors.muted}
                                        />
                                    </Pressable>
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
                                    <ActivityIndicator color={colors.onDark} />
                                ) : (
                                    <>
                                        <Ionicons name="save-outline" size={21} color={colors.onDark} />
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
    titleRow: { padding: 22 },
    list: {
        paddingHorizontal: 22,
        paddingBottom: 22
    },
    emptyList: {
        flexGrow: 1
    },
    userItem: {
        minHeight: 72,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderColor: colors.border,
        flexDirection: "row",
        alignItems: "center",
        gap: 10
    },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 5,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.infoSoft
    },
    avatarText: {
        color: colors.info,
        fontSize: 18,
        fontWeight: "800"
    },
    userInfo: {
        flex: 1,
        minWidth: 0
    },
    nameLine: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6
    },
    userName: {
        flexShrink: 1,
        color: colors.text,
        fontSize: 15,
        fontWeight: "700"
    },
    currentText: {
        color: colors.primary,
        fontSize: 11,
        fontWeight: "700"
    },
    userEmail: {
        color: colors.muted,
        fontSize: 13,
        marginTop: 4
    },
    iconButton: {
        width: 40,
        height: 40,
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
        backgroundColor: colors.overlay
    },
    modalDismissArea: {
        flex: 1
    },
    modalContent: {
        maxHeight: "86%",
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
    passwordField: {
        height: 50,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 6,
        flexDirection: "row",
        alignItems: "center"
    },
    passwordInput: {
        flex: 1,
        height: "100%",
        paddingLeft: 13,
        color: colors.text,
        fontSize: 16
    },
    eyeButton: {
        width: 48,
        height: 48,
        alignItems: "center",
        justifyContent: "center"
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
        color: colors.onDark,
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
