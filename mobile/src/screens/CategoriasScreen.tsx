import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Botao, Cabecalho, Campo, Erro, Estado, Icone, Janela, ui } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { ApiError, excluirCategoriaRequest, listarCategoriasRequest, salvarCategoriaRequest } from "../services/api";
import { colors } from "../theme";
import { Categoria } from "../types";

export function CategoriasScreen() {
    const { token, sair } = useAuth();
    const { width } = useWindowDimensions();
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erroLista, setErroLista] = useState("");
    const [dialogo, setDialogo] = useState<{ categoria?: Categoria; exclusao?: boolean }>();
    const [nome, setNome] = useState("");
    const [erro, setErro] = useState("");
    const [ocupado, setOcupado] = useState(false);

    const tratarErro = useCallback((falha: unknown, definir: (mensagem: string) => void) => {
        if (falha instanceof ApiError && falha.status === 401) void sair();
        else definir(falha instanceof ApiError ? falha.message : "Não foi possível conectar à API.");
    }, [sair]);

    const carregar = useCallback(async () => {
        if (!token) return;
        setCarregando(true);
        setErroLista("");
        try {
            setCategorias(await listarCategoriasRequest(token));
        } catch (falha) {
            tratarErro(falha, setErroLista);
        } finally {
            setCarregando(false);
        }
    }, [token, tratarErro]);

    useEffect(() => { void carregar(); }, [carregar]);

    function abrir(categoria?: Categoria, exclusao = false) {
        setErro("");
        setNome(categoria?.nome ?? "");
        setDialogo({ categoria, exclusao });
    }

    async function confirmar() {
        if (!token || !dialogo || ocupado) return;
        setOcupado(true);
        setErro("");
        try {
            if (dialogo.exclusao && dialogo.categoria) {
                await excluirCategoriaRequest(dialogo.categoria.id, token);
            } else {
                await salvarCategoriaRequest(dialogo.categoria?.id, nome, token);
            }
            setDialogo(undefined);
            await carregar();
        } catch (falha) {
            tratarErro(falha, setErro);
        } finally {
            setOcupado(false);
        }
    }

    function fechar() {
        if (!ocupado) setDialogo(undefined);
    }

    return (
        <ScrollView contentContainerStyle={[ui.page, width >= 900 && ui.pageWide]}
            refreshControl={<RefreshControl refreshing={carregando} onRefresh={() => void carregar()} />}>
            <Cabecalho titulo="Categorias" subtitulo="Organize receitas e despesas pelo assunto."
                acao={<Botao label="Nova categoria" icon="add" onPress={() => abrir()} />} />
            <View style={ui.card}>
                {erroLista ? (
                    <Estado icon="alert-circle-outline" titulo="Falha ao carregar categorias" descricao={erroLista}
                        acao={<Botao label="Tentar novamente" variant="secondary" onPress={() => void carregar()} />} />
                ) : carregando && !categorias.length ? (
                    <ActivityIndicator style={styles.loading} color={colors.primary} />
                ) : !categorias.length ? (
                    <Estado titulo="Nenhuma categoria cadastrada" icon="pricetag-outline" />
                ) : categorias.map((categoria, index) => (
                    <View key={categoria.id} style={[ui.row, styles.row, index < categorias.length - 1 && ui.divider]}>
                        <Icone icon="pricetag-outline" />
                        <Text style={[ui.grow, ui.rowTitle]}>{categoria.nome}</Text>
                        <Pressable accessibilityRole="button" accessibilityLabel={`Editar ${categoria.nome}`}
                            style={styles.action} onPress={() => abrir(categoria)}>
                            <Ionicons name="create-outline" size={20} color={colors.primary} />
                        </Pressable>
                        <Pressable accessibilityRole="button" accessibilityLabel={`Excluir ${categoria.nome}`}
                            style={styles.action} onPress={() => abrir(categoria, true)}>
                            <Ionicons name="trash-outline" size={19} color={colors.danger} />
                        </Pressable>
                    </View>
                ))}
            </View>
            {dialogo && (
                <Janela titulo={dialogo.exclusao ? "Excluir categoria?" : dialogo.categoria ? "Editar categoria" : "Nova categoria"}
                    fechar={fechar}>
                    {dialogo.exclusao
                        ? <Text style={ui.muted}>A categoria {dialogo.categoria?.nome} será removida se estiver sem vínculos.</Text>
                        : <Campo label="Nome" value={nome} onChangeText={setNome} maxLength={100} placeholder="Ex.: Educação"
                            onSubmitEditing={() => void confirmar()} />}
                    <Erro mensagem={erro} />
                    <View style={ui.wrap}>
                        <Botao label="Voltar" variant="secondary" onPress={fechar} disabled={ocupado} />
                        <Botao label={dialogo.exclusao ? "Excluir" : "Salvar"} variant={dialogo.exclusao ? "danger" : "primary"}
                            busy={ocupado} onPress={() => void confirmar()} />
                    </View>
                </Janela>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    row: { paddingHorizontal: 15, paddingVertical: 12 },
    action: { width: 42, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
    loading: { padding: 30 }
});
