import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
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
import { LoginScreen } from "./src/screens/LoginScreen";
import { colors } from "./src/theme";

function HomeScreen() {
    const { usuario, sair } = useAuth();

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
                        <Text numberOfLines={1} style={styles.userName}>{usuario?.nome}</Text>
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
                <Text style={styles.sectionLabel}>SALDO TOTAL</Text>
                <Text style={styles.balance}>R$ 0,00</Text>

                <View style={styles.divider} />

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Contas</Text>
                    <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                </View>
                <View style={styles.emptyState}>
                    <Ionicons name="wallet-outline" size={34} color={colors.info} />
                    <Text style={styles.emptyTitle}>Nenhuma conta cadastrada</Text>
                    <Text style={styles.emptyText}>Suas contas aparecerao aqui.</Text>
                </View>
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

    return token ? <HomeScreen /> : <LoginScreen />;
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
    userName: {
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
        backgroundColor: colors.background,
        paddingHorizontal: 20,
        paddingTop: 28
    },
    sectionLabel: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: "700"
    },
    balance: {
        color: colors.text,
        fontSize: 34,
        fontWeight: "800",
        marginTop: 5
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 26
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    sectionTitle: {
        color: colors.text,
        fontSize: 20,
        fontWeight: "800"
    },
    emptyState: {
        marginTop: 18,
        minHeight: 170,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
        padding: 20
    },
    emptyTitle: {
        color: colors.text,
        fontSize: 16,
        fontWeight: "700",
        marginTop: 10
    },
    emptyText: {
        color: colors.muted,
        fontSize: 14,
        marginTop: 4
    },
    pressed: {
        opacity: 0.65
    }
});
