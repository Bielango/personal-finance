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
    View
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../services/api";
import { colors } from "../theme";

export function LoginScreen() {
    const { entrar, cadastrar } = useAuth();
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
                    : "Nao foi possivel conectar com a API. Confira o endereco e a rede."
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
                <View style={styles.brand}>
                    <View style={styles.logo}>
                        <Ionicons name="wallet-outline" size={30} color="#FFFFFF" />
                    </View>
                    <Text style={styles.title}>Financas Pessoais</Text>
                    <Text style={styles.subtitle}>
                        {modoCadastro ? "Crie seu acesso" : "Entre na sua conta"}
                    </Text>
                </View>

                <View style={styles.form}>
                    {modoCadastro && (
                        <View style={styles.group}>
                            <Text style={styles.label}>Nome</Text>
                            <TextInput
                                value={nome}
                                onChangeText={setNome}
                                placeholder="Seu nome"
                                placeholderTextColor="#87928F"
                                autoCapitalize="words"
                                autoComplete="name"
                                style={styles.input}
                            />
                        </View>
                    )}

                    <View style={styles.group}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="voce@email.com"
                            placeholderTextColor="#87928F"
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
                                value={senha}
                                onChangeText={setSenha}
                                placeholder={modoCadastro ? "Minimo de 6 caracteres" : "Sua senha"}
                                placeholderTextColor="#87928F"
                                secureTextEntry={!mostrarSenha}
                                autoCapitalize="none"
                                autoComplete={modoCadastro ? "new-password" : "current-password"}
                                style={styles.passwordInput}
                                onSubmitEditing={() => void enviar()}
                            />
                            <Pressable
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
                        disabled={enviando}
                        onPress={() => void enviar()}
                        style={({ pressed }) => [
                            styles.submit,
                            pressed && styles.pressed,
                            enviando && styles.disabled
                        ]}
                    >
                        {enviando ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons
                                    name={modoCadastro ? "person-add-outline" : "log-in-outline"}
                                    size={21}
                                    color="#FFFFFF"
                                />
                                <Text style={styles.submitText}>
                                    {modoCadastro ? "Criar e entrar" : "Entrar"}
                                </Text>
                            </>
                        )}
                    </Pressable>

                    <Pressable onPress={alternarModo} style={styles.switchButton}>
                        <Text style={styles.switchText}>
                            {modoCadastro ? "Ja tenho uma conta" : "Criar primeiro acesso"}
                        </Text>
                    </Pressable>
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
        paddingVertical: 36
    },
    brand: {
        alignItems: "center",
        marginBottom: 30
    },
    logo: {
        width: 62,
        height: 62,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.primary,
        borderBottomWidth: 4,
        borderBottomColor: colors.accent,
        marginBottom: 14
    },
    title: {
        color: colors.text,
        fontSize: 28,
        fontWeight: "800"
    },
    subtitle: {
        color: colors.muted,
        fontSize: 15,
        marginTop: 5
    },
    form: {
        width: "100%",
        maxWidth: 440,
        alignSelf: "center",
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
        color: "#FFFFFF",
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
