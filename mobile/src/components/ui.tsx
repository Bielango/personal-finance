import { Ionicons } from "@expo/vector-icons";
import { PropsWithChildren, ReactNode, useState } from "react";
import {
    ActivityIndicator, FlatList, KeyboardAvoidingView, ListRenderItem, Modal, Platform,
    Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TextInputProps,
    View, useWindowDimensions
} from "react-native";
import { formatarMoeda } from "../formatacao";
import { colors, fonts, layout } from "../theme";
import { OperacaoTransacao } from "../types";

export type IconName = keyof typeof Ionicons.glyphMap;

type VarianteBotao = "primary" | "secondary" | "danger" | "text";

export function Botao({ label, icon, onPress, variant = "primary", disabled, busy, expanded }: {
    label: string;
    icon?: IconName;
    onPress: () => void;
    variant?: VarianteBotao;
    disabled?: boolean;
    busy?: boolean;
    expanded?: boolean;
}) {
    const cor = variant === "primary" ? colors.onDark : variant === "danger" ? colors.danger : colors.primary;
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ busy, expanded }}
            disabled={disabled || busy}
            onPress={onPress}
            style={({ pressed }) => [
                styles.button, styles[variant], pressed && styles.pressed, (disabled || busy) && styles.disabled
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

export function BotaoIcone({ label, icon, onPress, cor = colors.primary, disabled }: {
    label: string; icon: IconName; onPress: () => void; cor?: string; disabled?: boolean;
}) {
    return (
        <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={disabled}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed, disabled && styles.disabled]}>
            <Ionicons name={icon} size={20} color={cor} />
        </Pressable>
    );
}

export function Icone({ icon, cor = colors.primary, fundo = colors.infoSoft }: {
    icon: IconName; cor?: string; fundo?: string;
}) {
    return (
        <View aria-hidden style={[styles.icon, { backgroundColor: fundo }]}>
            <Ionicons name={icon} color={cor} size={20} />
        </View>
    );
}

export function Cabecalho({ titulo, subtitulo, acao }: { titulo: string; subtitulo?: string; acao?: ReactNode }) {
    return (
        <View style={styles.heading}>
            <View style={styles.headingText}>
                <Text accessibilityRole="header" style={styles.title}>{titulo}</Text>
                {subtitulo && <Text style={ui.muted}>{subtitulo}</Text>}
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
            <Text style={styles.emptyTitle}>{titulo}</Text>
            {descricao && <Text style={[ui.muted, styles.centerText]}>{descricao}</Text>}
            {acao}
        </View>
    );
}

export function Carregando() {
    return (
        <View style={styles.empty}>
            <ActivityIndicator accessibilityLabel="Carregando" size="large" color={colors.primary} />
        </View>
    );
}

export function Campo({ label, final, style, ...props }: TextInputProps & { label: string; final?: ReactNode }) {
    const input = (
        <TextInput
            accessibilityLabel={label}
            placeholderTextColor={colors.muted}
            selectionColor={colors.accent}
            {...props}
            style={[styles.input, !!final && styles.inputWithAction, props.multiline && styles.textarea, style]}
        />
    );
    return (
        <View style={styles.group}>
            <Text style={ui.label}>{label}</Text>
            {final ? <View style={styles.inputGroup}>{input}{final}</View> : input}
        </View>
    );
}

export function CampoSenha(props: TextInputProps & { label: string }) {
    const [mostrar, setMostrar] = useState(false);
    return (
        <Campo {...props} autoCapitalize="none" autoCorrect={false} secureTextEntry={!mostrar}
            final={<BotaoIcone label={mostrar ? "Ocultar senha" : "Mostrar senha"}
                icon={mostrar ? "eye-off-outline" : "eye-outline"} onPress={() => setMostrar(!mostrar)} />} />
    );
}

export function Erro({ mensagem }: { mensagem: string }) {
    return mensagem ? <Text accessibilityRole="alert" style={styles.error}>{mensagem}</Text> : null;
}

export function Janela({ titulo, fechar, children, rodape, ocupada }: PropsWithChildren<{
    titulo: string;
    fechar: () => void;
    rodape?: ReactNode;
    ocupada?: boolean;
}>) {
    const { width, height } = useWindowDimensions();
    const fecharSeLivre = () => { if (!ocupada) fechar(); };
    return (
        <Modal visible transparent animationType="fade" onRequestClose={fecharSeLivre}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.overlay}>
                <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={fecharSeLivre} />
                <View style={[styles.modal, { maxHeight: height * (width >= 700 ? 0.89 : 0.91) }]}>
                    <View style={styles.modalHeading}>
                        <Text accessibilityRole="header" style={[ui.sectionTitle, styles.modalTitle]}>{titulo}</Text>
                        <BotaoIcone label="Fechar" icon="close" onPress={fecharSeLivre} disabled={ocupada} />
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

export function Confirmacao({ titulo, mensagem, label, confirmar, fechar, busy, erro, variant = "danger" }: {
    titulo: string;
    mensagem?: string;
    label: string;
    confirmar: () => void;
    fechar: () => void;
    busy?: boolean;
    erro?: string;
    variant?: "primary" | "danger";
}) {
    return (
        <Janela titulo={titulo} fechar={fechar} ocupada={busy}>
            {mensagem && <Text style={ui.muted}>{mensagem}</Text>}
            {erro && <Erro mensagem={erro} />}
            <View style={[ui.wrap, styles.dialogActions]}>
                <Botao label="Voltar" variant="secondary" onPress={fechar} disabled={busy} />
                <Botao label={label} variant={variant} onPress={confirmar} busy={busy} />
            </View>
        </Janela>
    );
}

type Opcao<T> = { valor: T; label: string; descricao?: string; icon?: IconName };
type EscolhaProps<T> = {
    label: string;
    opcoes: readonly Opcao<T>[];
    valor: T | null;
    selecionar: (valor: T) => void;
};

export function Escolha<T extends string | number>({ label, opcoes, valor, selecionar }: EscolhaProps<T>) {
    return (
        <View style={styles.group}>
            <Text style={ui.label}>{label}</Text>
            <View style={styles.choices}>
                {opcoes.map(opcao => {
                    const ativa = opcao.valor === valor;
                    return (
                        <Pressable
                            key={opcao.valor}
                            accessibilityRole="button"
                            accessibilityLabel={opcao.label}
                            {...(Platform.OS === "web" ? { "aria-pressed": ativa } : { accessibilityState: { selected: ativa } })}
                            onPress={() => selecionar(opcao.valor)}
                            style={({ pressed }) => [styles.choice, ativa && styles.choiceActive, pressed && styles.pressed]}
                        >
                            {opcao.icon && <Ionicons name={opcao.icon} size={16} color={ativa ? colors.primary : colors.muted} />}
                            <Text style={[styles.choiceText, ativa && styles.choiceTextActive]}>{opcao.label}</Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

export function FiltroStatus<T extends string | number>({ acao, ...escolha }: Omit<EscolhaProps<T>, "label"> & { acao?: ReactNode }) {
    return (
        <View style={styles.filterRow}>
            <View style={styles.filterOptions}><Escolha {...escolha} label="Status" /></View>
            {acao}
        </View>
    );
}

export function Seletor<T extends string | number>({ label, opcoes, valor, selecionar, aberto, alternar, placeholder }: EscolhaProps<T> & {
    aberto: boolean;
    alternar: () => void;
    placeholder?: string;
}) {
    const selecionada = opcoes.find(opcao => opcao.valor === valor);
    return (
        <View style={styles.group}>
            <Text style={ui.label}>{label}</Text>
            <Pressable accessibilityRole="button"
                accessibilityLabel={label + (selecionada ? ": " + selecionada.label : "")}
                accessibilityState={{ expanded: aberto }}
                onPress={alternar}
                style={({ pressed }) => [styles.selectTrigger, pressed && styles.pressed]}>
                {selecionada?.icon && <Ionicons name={selecionada.icon} size={18} color={colors.primary} />}
                <Text style={[ui.grow, selecionada ? ui.rowTitle : ui.muted]}>{selecionada?.label ?? placeholder ?? "Selecionar"}</Text>
                <Ionicons name={aberto ? "chevron-up" : "chevron-down"} size={18} color={colors.muted} />
            </Pressable>
            {aberto && (
                <View style={ui.card}>
                    {opcoes.length ? opcoes.map((opcao, indice) => {
                        const ativa = opcao.valor === valor;
                        return (
                            <Pressable key={opcao.valor} accessibilityRole="button"
                                {...(Platform.OS === "web" ? { "aria-pressed": ativa } : { accessibilityState: { selected: ativa } })}
                                accessibilityLabel={opcao.label} accessibilityHint={opcao.descricao}
                                onPress={() => selecionar(opcao.valor)}
                                style={({ pressed }) => [
                                    styles.selectOption, indice < opcoes.length - 1 && ui.divider,
                                    ativa && styles.selectActive, pressed && styles.pressed
                                ]}>
                                {opcao.icon && <Ionicons name={opcao.icon} size={18} color={colors.primary} />}
                                <View style={ui.grow}>
                                    <Text style={ui.rowTitle}>{opcao.label}</Text>
                                    {opcao.descricao && <Text style={ui.muted}>{opcao.descricao}</Text>}
                                </View>
                                {ativa && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                            </Pressable>
                        );
                    }) : <Text style={[ui.muted, styles.selectOption]}>Nenhuma opção disponível.</Text>}
                </View>
            )}
        </View>
    );
}

export function Indicadores({ itens, controle }: { itens: readonly { label: string; valor: string; cor?: string }[]; controle?: ReactNode }) {
    const { width } = useWindowDimensions();
    return (
        <View style={[styles.metrics, !!controle && width < 700 && styles.metricsStack]}>
            <View style={styles.metricItems}>
                {itens.map(item => (
                    <View key={item.label} style={[styles.metric, width < 480 && item.valor.length > 16 && styles.metricWide]}>
                        <Text style={ui.muted}>{item.label}</Text>
                        <Text style={[ui.money, styles.metricValue, item.cor && { color: item.cor }]}>{item.valor}</Text>
                    </View>
                ))}
            </View>
            {controle}
        </View>
    );
}

export function Valor({ valor, operacao, cor }: { valor: number; operacao?: OperacaoTransacao; cor?: string }) {
    const { width } = useWindowDimensions();
    const sinal = operacao ? (operacao === "+" ? "+\u00a0" : "−\u00a0") : "";
    const texto = sinal + formatarMoeda(valor);
    return (
        <Text style={[
            ui.money, styles.amount, width < 420 && texto.length > 16 && styles.amountCompact,
            cor && { color: cor }
        ]}>{texto}</Text>
    );
}

export function Etiqueta({ label, tom = "neutral" }: { label: string; tom?: "neutral" | "success" | "warning" }) {
    const cor = tom === "success" ? colors.success : tom === "warning" ? colors.warning : colors.primary;
    const fundo = tom === "success" ? colors.successSoft : tom === "warning" ? colors.warningSoft : colors.infoSoft;
    return <Text style={[styles.badge, { color: cor, backgroundColor: fundo }]}>{label}</Text>;
}

export function Registro({ inicio, children, fim, abrir, label }: PropsWithChildren<{
    inicio?: ReactNode;
    fim?: ReactNode;
    abrir?: () => void;
    label?: string;
}>) {
    const conteudo = (
        <>
            {inicio}
            <View style={ui.grow}>{children}</View>
            {fim}
            {abrir && <Ionicons name="chevron-forward" size={16} color={colors.muted} />}
        </>
    );

    return abrir ? (
        <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={abrir}
            style={({ pressed }) => [ui.record, pressed && styles.selectActive]}>
            {conteudo}
        </Pressable>
    ) : <View style={ui.record}>{conteudo}</View>;
}

export function ListaRegistros<T extends { id: number }>({ dados, cabecalho, renderItem, vazio, erro, carregando, atualizando, carregar }: {
    dados: T[];
    cabecalho: ReactNode;
    renderItem: ListRenderItem<T>;
    vazio: ReactNode;
    erro: string;
    carregando: boolean;
    atualizando: boolean;
    carregar: () => void;
}) {
    const { width } = useWindowDimensions();
    const registros = carregando || erro ? [] : dados;
    return (
        <FlatList
            data={registros}
            keyExtractor={item => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={[ui.page, width >= layout.widePage && ui.pageWide]}
            ListHeaderComponent={<View style={ui.stack}>{cabecalho}</View>}
            ListHeaderComponentStyle={styles.listHeader}
            ListEmptyComponent={carregando ? <Carregando /> : erro ? (
                <Estado icon="alert-circle-outline" titulo="Falha ao carregar" descricao={erro}
                    acao={<Botao variant="secondary" label="Tentar novamente" onPress={carregar} />} />
            ) : <>{vazio}</>}
            refreshControl={<RefreshControl refreshing={atualizando} onRefresh={carregar} colors={[colors.primary]} tintColor={colors.primary} />}
        />
    );
}

export const ui = StyleSheet.create({
    page: { paddingTop: layout.sectionGap, paddingBottom: 36 },
    pageWide: { paddingTop: layout.gutterWide },
    stack: { gap: layout.sectionGap },
    card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: layout.controlRadius },
    section: { gap: 13 },
    sectionTitle: { color: colors.text, fontFamily: fonts.display, fontSize: 27, lineHeight: 31 },
    muted: { color: colors.muted, fontSize: 13, lineHeight: 19 },
    label: { color: colors.text, fontSize: 13, fontWeight: "700" },
    row: { flexDirection: "row", gap: 12, alignItems: "center" },
    wrap: { flexDirection: "row", gap: 8, flexWrap: "wrap", alignItems: "center" },
    rowTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
    money: { fontFamily: fonts.numbers, color: colors.text, fontSize: 14, lineHeight: 21, fontVariant: ["tabular-nums"] },
    grow: { flex: 1, minWidth: 0 },
    divider: { borderBottomWidth: 1, borderColor: colors.border },
    record: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border },
    recordEnd: { flexShrink: 0, alignItems: "flex-end", maxWidth: "50%" }
});

const styles = StyleSheet.create({
    button: {
        minHeight: layout.controlSize, borderRadius: layout.controlRadius, borderWidth: 1,
        paddingHorizontal: 13, paddingVertical: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7
    },
    primary: { backgroundColor: colors.primary, borderColor: colors.primary },
    secondary: { backgroundColor: colors.surface, borderColor: colors.control },
    danger: { backgroundColor: colors.dangerSoft, borderColor: colors.dangerSoft },
    text: { borderColor: "transparent" },
    buttonLabel: { fontSize: 14, fontWeight: "700", flexShrink: 1 },
    pressed: { opacity: 0.78 },
    disabled: { opacity: 0.48 },
    iconButton: { width: layout.controlSize, height: layout.controlSize, borderRadius: layout.controlRadius, alignItems: "center", justifyContent: "center" },
    icon: { width: 40, height: 40, borderRadius: layout.controlRadius, alignItems: "center", justifyContent: "center" },
    heading: { flexDirection: "row", gap: 12, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" },
    headingText: { flexGrow: 1, flexShrink: 1, gap: 3 },
    title: { color: colors.primaryDark, fontFamily: fonts.display, fontSize: 50, lineHeight: 54 },
    empty: { padding: 24, minHeight: 150, alignItems: "center", justifyContent: "center", gap: 10 },
    emptyTitle: { ...ui.sectionTitle, textAlign: "center" },
    centerText: { textAlign: "center", maxWidth: 380 },
    group: { gap: 7 },
    input: {
        minHeight: layout.controlSize, borderWidth: 1, borderColor: colors.control, borderRadius: layout.controlRadius,
        paddingHorizontal: 12, paddingVertical: 9, color: colors.text, backgroundColor: colors.surface, fontSize: 15
    },
    inputGroup: {
        minHeight: layout.controlSize, flexDirection: "row", alignItems: "center", backgroundColor: colors.surface,
        borderWidth: 1, borderColor: colors.control, borderRadius: layout.controlRadius
    },
    inputWithAction: { flex: 1, minWidth: 0, borderWidth: 0, backgroundColor: "transparent" },
    textarea: { minHeight: 78, textAlignVertical: "top" },
    error: { color: colors.danger, backgroundColor: colors.dangerSoft, padding: 12, borderRadius: layout.controlRadius, fontSize: 13 },
    overlay: { flex: 1, padding: 14, justifyContent: "center", alignItems: "center", backgroundColor: colors.overlay },
    modal: { width: "100%", maxWidth: 620, borderRadius: layout.dialogRadius, backgroundColor: colors.surface, overflow: "hidden" },
    modalHeading: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        borderBottomWidth: 1, borderBottomColor: colors.border, paddingLeft: 20, paddingRight: 8, paddingVertical: 7
    },
    modalTitle: { flex: 1 },
    modalBody: { padding: 20, gap: 16 },
    modalFooter: { paddingHorizontal: 20, paddingVertical: 12, gap: 8, borderTopWidth: 1, borderColor: colors.border },
    dialogActions: { justifyContent: "flex-end" },
    choices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    choice: {
        minHeight: layout.controlSize, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
        borderRadius: layout.controlRadius, paddingHorizontal: 9,
        borderWidth: 1, borderColor: colors.control, backgroundColor: colors.surface
    },
    choiceActive: { borderColor: colors.primary, backgroundColor: colors.selection },
    choiceText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
    choiceTextActive: { color: colors.primary, fontWeight: "800" },
    filterRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 12 },
    filterOptions: { flexShrink: 1, minWidth: 0 },
    selectTrigger: {
        minHeight: layout.controlSize, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8,
        borderWidth: 1, borderColor: colors.control, borderRadius: layout.controlRadius, backgroundColor: colors.surface
    },
    selectOption: { minHeight: layout.controlSize, padding: 10, flexDirection: "row", alignItems: "center", gap: 8 },
    selectActive: { backgroundColor: colors.selection },
    metrics: {
        flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12,
        borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border
    },
    metricsStack: { flexDirection: "column", alignItems: "stretch" },
    metricItems: { flexGrow: 1, flexShrink: 1, minWidth: 0, flexDirection: "row", flexWrap: "wrap", columnGap: 20, rowGap: 12 },
    metric: { flexGrow: 1, flexBasis: 125, maxWidth: 250, gap: 3 },
    metricWide: { flexBasis: "100%", maxWidth: "100%" },
    metricValue: { color: colors.primaryDark, fontSize: 20, lineHeight: 26 },
    amount: { textAlign: "right" },
    amountCompact: { fontSize: 12, lineHeight: 18 },
    badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, fontSize: 12, fontWeight: "700" },
    listHeader: { paddingBottom: layout.sectionGap, borderBottomWidth: 1, borderColor: colors.control }
});
