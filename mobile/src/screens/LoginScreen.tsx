import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Marca } from "../components/Marca";
import { Botao, Campo, CampoSenha, Erro, ui } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../services/api";
import { colors, layout } from "../theme";

export function LoginScreen() {
    const { entrar, cadastrar } = useAuth();
    const { width } = useWindowDimensions();
    const desktop = width >= 850;
    const [modoCadastro, setModoCadastro] = useState(false);
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState("");

    async function enviar() {
        if (enviando) return;
        if ((modoCadastro && !nome.trim()) || !email.trim() || !senha) {
            setErro("Preencha todos os campos.");
            return;
        }

        setEnviando(true);
        setErro("");
        try {
            if (modoCadastro) await cadastrar(nome.trim(), email.trim(), senha);
            else await entrar(email.trim(), senha);
        } catch (falha) {
            setErro(falha instanceof ApiError ? falha.message : "Não foi possível conectar à API. Verifique se o servidor está em execução.");
        } finally {
            setEnviando(false);
        }
    }

    function alternarModo() {
        setModoCadastro(!modoCadastro);
        setErro("");
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <View style={[ui.card, styles.shell, desktop && styles.shellWide]}>
                    <View style={[styles.brand, desktop && styles.brandWide]}>
                        <Marca ampla={desktop} />
                        {desktop && (
                            <Text style={styles.brandDescription}>Acompanhe suas contas, seus lançamentos e o que está por vencer.</Text>
                        )}
                    </View>
                    <View style={styles.form}>
                        <View>
                            <Text accessibilityRole="header" style={[ui.sectionTitle, styles.formTitle]}>
                                {modoCadastro ? "Criar acesso" : "Entrar"}
                            </Text>
                            {modoCadastro && <Text style={ui.muted}>Cadastre o primeiro usuário do sistema.</Text>}
                        </View>
                        {modoCadastro && (
                            <Campo label="Nome" value={nome} onChangeText={setNome} placeholder="Seu nome"
                                autoCapitalize="words" autoComplete="name" maxLength={100} />
                        )}
                        <Campo label="E-mail" value={email} onChangeText={setEmail} placeholder="voce@email.com"
                            keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" maxLength={100} />
                        <CampoSenha label="Senha" value={senha} onChangeText={setSenha}
                            placeholder={modoCadastro ? "Mínimo de 6 caracteres" : "Sua senha"}
                            autoComplete={modoCadastro ? "new-password" : "current-password"} onSubmitEditing={() => void enviar()} />
                        <Erro mensagem={erro} />
                        <Botao label={modoCadastro ? "Criar e entrar" : "Entrar"} icon="log-in-outline"
                            busy={enviando} onPress={() => void enviar()} />
                        <Botao label={modoCadastro ? "Já tenho uma conta" : "Criar primeiro acesso"}
                            variant="text" disabled={enviando} onPress={alternarModo} />
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: layout.gutter, paddingVertical: 36 },
    shell: { width: "100%", maxWidth: 500, borderRadius: layout.dialogRadius, overflow: "hidden" },
    shellWide: { maxWidth: 880, flexDirection: "row", alignItems: "stretch" },
    brand: { alignItems: "flex-start", backgroundColor: colors.primary, padding: 24, gap: 12 },
    brandWide: { flex: 1, padding: 36, justifyContent: "center" },
    brandDescription: { color: colors.mutedOnDark, fontSize: 16, lineHeight: 24, maxWidth: 280 },
    form: { width: "100%", maxWidth: 440, padding: 24, gap: 16 },
    formTitle: { fontSize: 43, lineHeight: 46 }
});
