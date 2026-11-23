import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View
} from "react-native";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ContasScreen } from "./src/screens/ContasScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { TransacoesScreen } from "./src/screens/TransacoesScreen";
import { UsuariosScreen } from "./src/screens/UsuariosScreen";
import { colors } from "./src/theme";

type Tab = "contas" | "transacoes" | "usuarios";

const tabs = [
    { key: "contas" as const, label: "Contas", icon: "wallet-outline" as const },
    { key: "transacoes" as const, label: "Transações", icon: "swap-vertical-outline" as const },
    { key: "usuarios" as const, label: "Usuarios", icon: "people-outline" as const }
];

function ConteudoAutenticado() {
    const { usuario, sair } = useAuth();
    const [tab, setTab] = useState<Tab>("contas");

    function confirmarSaida() {
        if (Platform.OS === "web") {
            if (globalThis.confirm("Deseja encerrar sua sessao?")) void sair();
            return;
        }

        Alert.alert("Sair", "Deseja encerrar sua sessao?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Sair", style: "destructive", onPress: () => void sair() }
        ]);
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar style="light" />
            <View style={styles.header}>
                <View style={styles.identity}>
                    <View style={styles.smallLogo}>
                        <Ionicons name="wallet-outline" size={21} color="#FFFFFF" />
                    </View>
                    <View style={styles.identityText}>
                        <Text style={styles.brandName}>Financas Pessoais</Text>
                        <Text numberOfLines={1} style={styles.loggedUserName}>{usuario?.nome}</Text>
                    </View>
                </View>
                <Pressable
                    accessibilityLabel="Sair"
                    onPress={confirmarSaida}
                    style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
                >
                    <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
                </Pressable>
            </View>

            <View style={styles.content}>
                {tab === "contas" && <ContasScreen />}
                {tab === "transacoes" && <TransacoesScreen />}
                {tab === "usuarios" && <UsuariosScreen />}
            </View>

            <View style={styles.tabBar}>
                {tabs.map(item => {
                    const ativa = item.key === tab;
                    return (
                        <Pressable
                            key={item.key}
                            accessibilityRole="tab"
                            accessibilityState={{ selected: ativa }}
                            onPress={() => setTab(item.key)}
                            style={({ pressed }) => [
                                styles.tab,
                                ativa && styles.activeTab,
                                pressed && styles.pressed
                            ]}
                        >
                            <Ionicons
                                name={item.icon}
                                size={22}
                                color={ativa ? colors.primary : colors.muted}
                            />
                            <Text style={[styles.tabLabel, ativa && styles.activeTabLabel]}>
                                {item.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </SafeAreaView>
    );
}

function Root() {
    const { token, carregando } = useAuth();

    if (carregando) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return token ? <ConteudoAutenticado /> : <LoginScreen />;
}

export default function App() {
    return (
        <AuthProvider>
            <Root />
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.primaryDark
    },
    loading: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background
    },
    header: {
        minHeight: 66,
        paddingHorizontal: 16,
        paddingVertical: 9,
        backgroundColor: colors.primaryDark,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    identity: {
        flex: 1,
        minWidth: 0,
        flexDirection: "row",
        alignItems: "center",
        gap: 10
    },
    smallLogo: {
        width: 38,
        height: 38,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.primary
    },
    identityText: {
        flex: 1,
        minWidth: 0
    },
    brandName: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800"
    },
    loggedUserName: {
        color: "#C6DDDA",
        fontSize: 12,
        marginTop: 2
    },
    logoutButton: {
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center"
    },
    content: {
        flex: 1,
        backgroundColor: colors.background
    },
    tabBar: {
        minHeight: 66,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.surface,
        flexDirection: "row"
    },
    tab: {
        flex: 1,
        minWidth: 0,
        borderTopWidth: 3,
        borderTopColor: "transparent",
        alignItems: "center",
        justifyContent: "center",
        gap: 3
    },
    activeTab: {
        borderTopColor: colors.accent
    },
    tabLabel: {
        color: colors.muted,
        fontSize: 11,
        fontWeight: "600"
    },
    activeTabLabel: {
        color: colors.primary,
        fontWeight: "800"
    },
    pressed: {
        opacity: 0.65
    }
});
