import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    useWindowDimensions
} from "react-native";
import { Marca } from "../components/Marca";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../services/api";
import { colors, fonts } from "../theme";

export function LoginScreen() {
    const { entrar, cadastrar } = useAuth();
    const { width } = useWindowDimensions();
    const desktop = width >= 850;
    const [modoCadastro, setModoCadastro] = useState(false);
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState("");

    async function enviar() {
        if ((modoCadastro && !nome.trim()) || !email.trim() || !senha) {
            setErro("Preencha todos os campos.");
            return;
        }

        setEnviando(true);
        setErro("");

        try {
            if (modoCadastro) {
                await cadastrar(nome.trim(), email.trim(), senha);
            } else {
                await entrar(email.trim(), senha);
            }
        } catch (error) {
            setErro(
                error instanceof ApiError
                    ? error.message
                    : "Não foi possível conectar à API. Verifique se o servidor está em execução."
            );
        } finally {
            setEnviando(false);
        }
    }

    function alternarModo() {
        setModoCadastro(value => !value);
        setErro("");
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.screen}
        >
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <View style={[styles.shell, desktop && styles.shellWide]}>
                    <View style={[styles.brand, desktop && styles.brandWide]}>
                        <Marca ampla={desktop} />
                        {desktop && (
                            <Text style={styles.brandDescription}>Acompanhe suas contas, seus lançamentos e o que está por vencer.</Text>
                        )}
                    </View>

                    <View style={styles.form}>
                        <View style={styles.formHeading}>
                            <Text accessibilityRole="header" style={styles.formTitle}>
                                {modoCadastro ? "Criar acesso" : "Entrar"}
                            </Text>
                            <Text style={styles.subtitle}>
                                {modoCadastro ? "Cadastre o primeiro usuário do sistema." : "Use seu e-mail e senha para acessar o painel."}
                            </Text>
                        </View>
                        {modoCadastro && (
                            <View style={styles.group}>
                                <Text style={styles.label}>Nome</Text>
                                <TextInput
                                    accessibilityLabel="Nome"
                                    value={nome}
                                    onChangeText={setNome}
                                    placeholder="Seu nome"
                                    placeholderTextColor={colors.muted}
                                    autoCapitalize="words"
                                    autoComplete="name"
                                    style={styles.input}
                                />
                            </View>
                        )}

                        <View style={styles.group}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                accessibilityLabel="E-mail"
                                value={email}
                                onChangeText={setEmail}
                                placeholder="voce@email.com"
                                placeholderTextColor={colors.muted}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoComplete="email"
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.group}>
                            <Text style={styles.label}>Senha</Text>
                            <View style={styles.passwordField}>
                                <TextInput
                                    accessibilityLabel="Senha"
                                    value={senha}
                                    onChangeText={setSenha}
                                    placeholder={modoCadastro ? "Mínimo de 6 caracteres" : "Sua senha"}
                                    placeholderTextColor={colors.muted}
                                    secureTextEntry={!mostrarSenha}
                                    autoCapitalize="none"
                                    autoComplete={modoCadastro ? "new-password" : "current-password"}
                                    style={styles.passwordInput}
                                    onSubmitEditing={() => void enviar()}
                                />
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                                    hitSlop={8}
                                    onPress={() => setMostrarSenha(value => !value)}
                                    style={({ pressed }) => [styles.eyeButton, pressed && styles.pressed]}
                                >
                                    <Ionicons
                                        name={mostrarSenha ? "eye-off-outline" : "eye-outline"}
                                        size={22}
                                        color={colors.muted}
                                    />
                                </Pressable>
                            </View>
                        </View>

                        {!!erro && (
                            <View style={styles.errorBox}>
                                <Ionicons name="alert-circle-outline" size={19} color={colors.danger} />
                                <Text style={styles.errorText}>{erro}</Text>
                            </View>
                        )}

                        <Pressable
                            accessibilityRole="button"
                            disabled={enviando}
                            onPress={() => void enviar()}
                            style={({ pressed }) => [
                                styles.submit,
                                pressed && styles.pressed,
                                enviando && styles.disabled
                            ]}
                        >
                            {enviando ? (
                                <ActivityIndicator color={colors.onDark} />
                            ) : (
                                <>
                                    <Ionicons
                                        name={modoCadastro ? "person-add-outline" : "log-in-outline"}
                                        size={21}
                                        color={colors.onDark}
                                    />
                                    <Text style={styles.submitText}>
                                        {modoCadastro ? "Criar e entrar" : "Entrar"}
                                    </Text>
                                </>
                            )}
                        </Pressable>

                        <Pressable accessibilityRole="button" onPress={alternarModo} style={styles.switchButton}>
                            <Text style={styles.switchText}>
                                {modoCadastro ? "Já tenho uma conta" : "Criar primeiro acesso"}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background
    },
    content: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingVertical: 36,
        alignItems: "center"
    },
    shell: {
        width: "100%",
        maxWidth: 500,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        backgroundColor: colors.surface,
        overflow: "hidden"
    },
    shellWide: { maxWidth: 880, flexDirection: "row", alignItems: "stretch" },
    brand: {
        alignItems: "flex-start",
        backgroundColor: colors.primary,
        padding: 24,
        gap: 12
    },
    brandWide: { flex: 1, padding: 36, justifyContent: "center" },
    brandDescription: { color: colors.mutedOnDark, fontSize: 16, lineHeight: 24, maxWidth: 280 },
    subtitle: {
        color: colors.muted,
        fontSize: 14,
        marginTop: 5
    },
    formHeading: { marginBottom: 4 },
    formTitle: { color: colors.primaryDark, fontFamily: fonts.display, fontSize: 43, lineHeight: 46 },
    form: {
        width: "100%",
        maxWidth: 440,
        padding: 24,
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
        borderColor: colors.control,
        borderRadius: 6,
        backgroundColor: colors.surface,
        paddingHorizontal: 13,
        color: colors.text,
        fontSize: 16
    },
    passwordField: {
        height: 50,
        borderWidth: 1,
        borderColor: colors.control,
        borderRadius: 6,
        backgroundColor: colors.surface,
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
    submit: {
        height: 50,
        borderRadius: 6,
        backgroundColor: colors.primary,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8
    },
    submitText: {
        color: colors.onDark,
        fontSize: 16,
        fontWeight: "800"
    },
    switchButton: {
        minHeight: 42,
        alignItems: "center",
        justifyContent: "center"
    },
    switchText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: "700"
    },
    pressed: {
        opacity: 0.68
    },
    disabled: {
        opacity: 0.55
    }
});
