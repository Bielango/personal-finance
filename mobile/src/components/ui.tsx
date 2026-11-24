import { Ionicons } from "@expo/vector-icons";
import { PropsWithChildren, ReactNode } from "react";
import {
    ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView,
    StyleSheet, Text, TextInput, TextInputProps, View, useWindowDimensions
} from "react-native";
import { colors, fonts } from "../theme";

export type IconName = keyof typeof Ionicons.glyphMap;

export function Botao({ label, icon, onPress, variant = "primary", disabled, busy }: {
    label: string;
    icon?: IconName;
    onPress: () => void;
    variant?: "primary" | "secondary" | "danger";
    disabled?: boolean;
    busy?: boolean;
}) {
    const principal = variant === "primary";
    const cor = principal ? colors.surface : variant === "danger" ? colors.danger : colors.primary;
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            disabled={disabled || busy}
            onPress={onPress}
            style={({ pressed }) => [
                styles.button, principal && styles.primary,
                variant === "danger" && styles.danger, pressed && styles.hover,
                (disabled || busy) && styles.disabled
            ]}
        >
            {busy ? <ActivityIndicator size="small" color={cor} /> : (
                <>
                    {icon && <Ionicons name={icon} size={18} color={cor} />}
                    <Text style={[styles.buttonLabel, { color: cor }]}>{label}</Text>
                </>
            )}
        </Pressable>
    );
}

export function Icone({ icon, cor = colors.primary, fundo = colors.successSoft }: {
    icon: IconName; cor?: string; fundo?: string;
}) {
    return (
        <View style={[styles.icon, { backgroundColor: fundo }]}>
            <Ionicons name={icon} color={cor} size={20} />
        </View>
    );
}

export function Cabecalho({ titulo, subtitulo, acao }: { titulo: string; subtitulo?: string; acao?: ReactNode }) {
    return (
        <View style={styles.heading}>
            <View style={styles.headingText}>
                <Text accessibilityRole="header" style={styles.title}>{titulo}</Text>
                {subtitulo && <Text style={styles.muted}>{subtitulo}</Text>}
            </View>
            {acao}
        </View>
    );
}

export function Estado({ icon, titulo, descricao, acao }: {
    icon: IconName; titulo: string; descricao?: string; acao?: ReactNode;
}) {
    return (
        <View style={styles.empty}>
            <Icone icon={icon} />
            <Text style={styles.sectionTitle}>{titulo}</Text>
            {descricao && <Text style={[styles.muted, styles.centerText]}>{descricao}</Text>}
            {acao}
        </View>
    );
}

export function Campo({ label, ...props }: TextInputProps & { label: string }) {
    return (
        <View style={styles.group}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                accessibilityLabel={label}
                placeholderTextColor={colors.muted}
                selectionColor={colors.accent}
                {...props}
                style={[styles.input, props.multiline && styles.textarea, props.style]}
            />
        </View>
    );
}

export function Erro({ mensagem }: { mensagem: string }) {
    return mensagem ? <Text accessibilityRole="alert" style={styles.error}>{mensagem}</Text> : null;
}

export function Janela({ titulo, fechar, children, rodape }: PropsWithChildren<{
    titulo: string;
    fechar: () => void;
    rodape?: ReactNode;
}>) {
    const { width, height } = useWindowDimensions();
    return (
        <Modal visible transparent animationType="fade" onRequestClose={fechar}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.overlay}>
                <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={fechar} />
                <View style={[styles.modal, { maxHeight: height * (width >= 700 ? 0.89 : 0.91) }]}>
                    <View style={styles.modalHeading}>
                        <Text accessibilityRole="header" style={styles.sectionTitle}>{titulo}</Text>
                        <Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={fechar} style={styles.close}>
                            <Ionicons name="close" size={24} color={colors.muted} />
                        </Pressable>
                    </View>
                    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalBody}>
                        {children}
                    </ScrollView>
                    {rodape && <View style={styles.modalFooter}>{rodape}</View>}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

export function Escolha<T extends string | number>({ label, opcoes, valor, selecionar }: {
    label: string;
    opcoes: { valor: T; label: string }[];
    valor: T | null;
    selecionar: (valor: T) => void;
}) {
    return (
        <View style={styles.group}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.choices}>
                {opcoes.map(opcao => {
                    const ativa = opcao.valor === valor;
                    return (
                        <Pressable
                            key={opcao.valor}
                            accessibilityRole="button"
                            accessibilityState={{ selected: ativa }}
                            onPress={() => selecionar(opcao.valor)}
                            style={({ pressed }) => [styles.choice, ativa && styles.choiceActive, pressed && styles.hover]}
                        >
                            <Text style={[styles.choiceText, ativa && styles.choiceTextActive]}>{opcao.label}</Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

export const ui = StyleSheet.create({
    page: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 36, gap: 24 },
    pageWide: { paddingHorizontal: 36, paddingTop: 36 },
    card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 6 },
    section: { gap: 13 },
    sectionTitle: { color: colors.text, fontFamily: fonts.display, fontSize: 27, lineHeight: 31 },
    muted: { color: colors.muted, fontSize: 13, lineHeight: 19 },
    row: { flexDirection: "row", gap: 12, alignItems: "center" },
    wrap: { flexDirection: "row", gap: 9, flexWrap: "wrap", alignItems: "center" },
    rowTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
    money: { fontFamily: fonts.numbers, color: colors.text, fontSize: 14, lineHeight: 21, fontVariant: ["tabular-nums"] },
    grow: { flex: 1, minWidth: 0 },
    divider: { borderBottomWidth: 1, borderColor: colors.border }
});

const styles = StyleSheet.create({
    button: {
        minHeight: 44, borderRadius: 5, borderWidth: 1, borderColor: colors.control,
        backgroundColor: colors.surface, paddingHorizontal: 13, paddingVertical: 8,
        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7
    },
    primary: { backgroundColor: colors.primary, borderColor: colors.primary },
    danger: { backgroundColor: colors.dangerSoft, borderColor: colors.dangerSoft },
    buttonLabel: { fontSize: 14, fontWeight: "700" },
    hover: { opacity: 0.78 },
    disabled: { opacity: 0.48 },
    icon: { width: 40, height: 40, borderRadius: 5, alignItems: "center", justifyContent: "center" },
    heading: { flexDirection: "row", gap: 12, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" },
    headingText: { flexGrow: 1, flexShrink: 1, gap: 3 },
    title: { color: colors.primaryDark, fontFamily: fonts.display, fontSize: 50, lineHeight: 54 },
    muted: ui.muted,
    sectionTitle: ui.sectionTitle,
    empty: { padding: 25, minHeight: 150, alignItems: "center", justifyContent: "center", gap: 10 },
    centerText: { textAlign: "center", maxWidth: 380 },
    group: { gap: 7 },
    label: { color: colors.text, fontSize: 13, fontWeight: "700" },
    input: {
        minHeight: 45, borderWidth: 1, borderColor: colors.border, borderRadius: 9,
        paddingHorizontal: 12, paddingVertical: 9, color: colors.text, backgroundColor: colors.background, fontSize: 15
    },
    textarea: { minHeight: 78, textAlignVertical: "top" },
    error: { color: colors.danger, backgroundColor: colors.dangerSoft, padding: 12, borderRadius: 5, fontSize: 13 },
    overlay: { flex: 1, padding: 14, justifyContent: "center", alignItems: "center", backgroundColor: colors.overlay },
    modal: { width: "100%", maxWidth: 620, borderRadius: 8, backgroundColor: colors.surface, overflow: "hidden" },
    modalHeading: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        borderBottomWidth: 1, borderBottomColor: colors.border, paddingLeft: 21, paddingRight: 10, paddingVertical: 7
    },
    close: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
    modalBody: { padding: 21, gap: 16 },
    modalFooter: { paddingHorizontal: 21, paddingVertical: 12, gap: 9, borderTopWidth: 1, borderColor: colors.border },
    choices: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
    choice: {
        minHeight: 44, justifyContent: "center", borderRadius: 5, paddingHorizontal: 11,
        borderWidth: 1, borderColor: colors.control, backgroundColor: colors.surface
    },
    choiceActive: { borderColor: colors.primary, backgroundColor: colors.selection },
    choiceText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
    choiceTextActive: { color: colors.primary, fontWeight: "800" }
});
