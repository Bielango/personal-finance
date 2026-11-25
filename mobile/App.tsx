import { Ionicons } from "@expo/vector-icons";
import { BarlowCondensed_600SemiBold } from "@expo-google-fonts/barlow-condensed/600SemiBold";
import { IBMPlexMono_500Medium } from "@expo-google-fonts/ibm-plex-mono/500Medium";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, SafeAreaView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Marca } from "./src/components/Marca";
import { Botao, IconName, Janela, ui } from "./src/components/ui";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { AgendamentosScreen } from "./src/screens/AgendamentosScreen";
import { ContasScreen } from "./src/screens/ContasScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { TransacoesScreen } from "./src/screens/TransacoesScreen";
import { UsuariosScreen } from "./src/screens/UsuariosScreen";
import { VisaoGeralScreen } from "./src/screens/VisaoGeralScreen";
import { colors, fonts } from "./src/theme";
import { TransacaoResumo } from "./src/types";

type Tela =
    { aba: "visao" | "contas" | "usuarios" } |
    { aba: "agendamentos"; id?: number } |
    { aba: "transacoes"; inicial?: Pick<TransacaoResumo, "id" | "dataInicio"> };

const abas: { aba: Tela["aba"]; label: string; curto: string; icon: IconName }[] = [
    { aba: "visao", label: "Visão geral", curto: "Resumo", icon: "grid-outline" },
    { aba: "contas", label: "Contas", curto: "Contas", icon: "wallet-outline" },
    { aba: "transacoes", label: "Transações", curto: "Transações", icon: "swap-vertical-outline" },
    { aba: "agendamentos", label: "Agendamentos", curto: "Agenda", icon: "calendar-outline" },
    { aba: "usuarios", label: "Usuários", curto: "Usuários", icon: "people-outline" }
];

function ConteudoAutenticado() {
    const { usuario, sair } = useAuth();
    const { width } = useWindowDimensions();
    const desktop = width >= 1000;
    const [tela, navegar] = useState<Tela>({ aba: "visao" });
    const [confirmarSaida, setConfirmarSaida] = useState(false);
    const listaTradicional = tela.aba === "contas" || tela.aba === "transacoes" || tela.aba === "usuarios";
    const primeiraLetra = usuario?.nome.trim().charAt(0).toUpperCase() || "?";
    const abrirContas = () => navegar({ aba: "contas" });
    const abrirAgendamentos = () => navegar({ aba: "agendamentos" });
    const abrirTransacao = (item: TransacaoResumo) => navegar({ aba: "transacoes", inicial: item });

    function renderAbas() {
        return abas.filter(item => desktop || item.aba !== "usuarios").map(item => {
            const selecionada = item.aba === tela.aba;
            const cor = desktop ? (selecionada ? colors.onDark : colors.mutedOnDark) : (selecionada ? colors.primary : colors.muted);
            return (
                <Pressable
                    key={item.aba}
                    accessibilityRole="tab"
                    accessibilityLabel={item.label}
                    accessibilityState={{ selected: selecionada }}
                    onPress={() => navegar({ aba: item.aba })}
                    style={({ pressed }) => [
                        desktop ? styles.navItem : styles.tab,
                        selecionada && (desktop ? styles.navSelected : styles.tabSelected),
                        pressed && styles.pressed
                    ]}
                >
                    {!desktop && <Ionicons name={item.icon} color={cor} size={19} />}
                    <Text style={[desktop ? styles.navLabel : styles.tabLabel, { color: cor }]} numberOfLines={1}>
                        {desktop ? item.label : item.curto}
                    </Text>
                </Pressable>
            );
        });
    }

    function barraUsuario() {
        return (
            <View style={styles.userBar}>
                {desktop ? (
                    <View style={styles.userName}>
                        <View style={styles.avatar}><Text style={styles.avatarLetter}>{primeiraLetra}</Text></View>
                        <Text style={styles.sessionName} numberOfLines={1}>{usuario?.nome}</Text>
                    </View>
                ) : (
                    <Pressable accessibilityRole="button" accessibilityLabel="Usuários" style={styles.avatar}
                        onPress={() => navegar({ aba: "usuarios" })}>
                        <Text style={styles.avatarLetter}>{primeiraLetra}</Text>
                    </Pressable>
                )}
                <Pressable accessibilityRole="button" accessibilityLabel="Sair" style={styles.logout}
                    onPress={() => setConfirmarSaida(true)}>
                    <Ionicons name="log-out-outline" size={21} color={colors.mutedOnDark} />
                </Pressable>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar style="light" />
            <View nativeID="finance-masthead" style={styles.masthead}>
                <View style={[styles.topbar, desktop && styles.topbarWide]}>
                    <Marca />
                    {desktop && (
                        <View accessibilityRole="tablist" style={styles.nav}>{renderAbas()}</View>
                    )}
                    {barraUsuario()}
                </View>
            </View>
            <View style={styles.main}>
                <View style={[styles.workspace, desktop && listaTradicional && styles.workspaceInset]}>
                    {tela.aba === "visao" && <VisaoGeralScreen abrirContas={abrirContas} abrirAgendamentos={abrirAgendamentos} abrirTransacao={abrirTransacao} />}
                    {tela.aba === "contas" && <ContasScreen />}
                    {tela.aba === "transacoes" && <TransacoesScreen key={tela.inicial?.id ?? "lista"} inicial={tela.inicial}
                        abrirAgendamento={id => navegar({ aba: "agendamentos", id })}
                        abrirContas={abrirContas} />}
                    {tela.aba === "agendamentos" && <AgendamentosScreen key={tela.id ?? "lista"} inicial={tela.id}
                        abrirContas={abrirContas} abrirTransacao={abrirTransacao} />}
                    {tela.aba === "usuarios" && <UsuariosScreen />}
                </View>
                {!desktop && <View accessibilityRole="tablist" style={styles.tabs}>{renderAbas()}</View>}
            </View>
            {confirmarSaida && (
                <Janela titulo="Encerrar sessão?" fechar={() => setConfirmarSaida(false)}>
                    <View style={ui.wrap}>
                        <Botao label="Voltar" variant="secondary" onPress={() => setConfirmarSaida(false)} />
                        <Botao label="Sair" icon="log-out-outline" onPress={() => void sair()} />
                    </View>
                </Janela>
            )}
        </SafeAreaView>
    );
}

function Root() {
    const { token, carregando } = useAuth();
    if (carregando) return <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /></View>;
    return token ? <ConteudoAutenticado /> : <LoginScreen />;
}

export default function App() {
    const [fontesProntas, erroFontes] = useFonts({
        [fonts.display]: BarlowCondensed_600SemiBold,
        [fonts.numbers]: IBMPlexMono_500Medium
    });

    useEffect(() => {
        if (Platform.OS !== "web") return;
        document.documentElement.lang = "pt-BR";
        document.title = "Finanças Pessoais";
        const estilo = document.createElement("style");
        estilo.textContent = `
            ::selection { color: ${colors.primaryDark}; background: ${colors.accent}; }
            :where(button, [role="button"], [role="tab"], a, input, textarea):focus-visible {
                outline: 2px solid ${colors.primary} !important;
                outline-offset: 2px;
            }
            #finance-masthead :focus-visible, #finance-balances :focus-visible {
                outline-color: ${colors.accent} !important;
                outline-offset: -4px;
            }
        `;
        document.head.append(estilo);
        return () => estilo.remove();
    }, []);

    return (
        <AuthProvider>
            {fontesProntas || erroFontes ? <Root /> : (
                <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /></View>
            )}
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.primaryDark },
    loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
    masthead: { backgroundColor: colors.primaryDark },
    nav: { flexDirection: "row", alignSelf: "stretch", gap: 4 },
    navItem: {
        paddingHorizontal: 11, borderBottomWidth: 3, borderTopWidth: 3,
        borderColor: "transparent", alignItems: "center", justifyContent: "center"
    },
    navSelected: { borderBottomColor: colors.accent },
    navLabel: { fontSize: 14, fontWeight: "600" },
    main: { flex: 1, minWidth: 0, backgroundColor: colors.background },
    topbar: {
        minHeight: 60, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12,
        alignSelf: "center", width: "100%", maxWidth: 1320, paddingHorizontal: 16
    },
    topbarWide: { minHeight: 68, paddingHorizontal: 36 },
    userBar: { flexDirection: "row", alignItems: "center", gap: 4 },
    userName: { flexDirection: "row", gap: 8, alignItems: "center" },
    sessionName: { color: colors.mutedOnDark, fontSize: 13, fontWeight: "600", maxWidth: 112 },
    avatar: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
    avatarLetter: { fontSize: 14, color: colors.onDark, fontWeight: "700", paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: colors.dividerOnDark },
    logout: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
    workspace: { flex: 1, width: "100%", maxWidth: 1320, alignSelf: "center" },
    workspaceInset: { paddingHorizontal: 14, paddingTop: 14 },
    tabs: { flexDirection: "row", borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    tab: {
        flex: 1, minWidth: 0, minHeight: 54, borderTopWidth: 2, borderColor: "transparent",
        justifyContent: "center", alignItems: "center", gap: 3
    },
    tabSelected: { borderTopColor: colors.primary, backgroundColor: colors.selection },
    tabLabel: { fontSize: 11, fontWeight: "700" },
    pressed: { opacity: 0.82 }
});
