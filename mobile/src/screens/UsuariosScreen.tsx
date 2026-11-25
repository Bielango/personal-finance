import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
    Botao, BotaoIcone, Cabecalho, Campo, CampoSenha, Confirmacao, Erro, Estado,
    Etiqueta, Janela, ListaRegistros, Registro, ui
} from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { ApiError, atualizarUsuarioRequest, criarUsuarioRequest, excluirUsuarioRequest, listarUsuariosRequest } from "../services/api";
import { colors, layout } from "../theme";
import { Usuario } from "../types";

type UsuarioInput = { nome: string; email: string; senha: string };

function FormularioUsuario({ usuario, erro, ocupado, salvar, fechar }: {
    usuario?: Usuario;
    erro: string;
    ocupado: boolean;
    salvar: (dados: UsuarioInput) => void;
    fechar: () => void;
}) {
    const [nome, setNome] = useState(usuario?.nome ?? "");
    const [email, setEmail] = useState(usuario?.email ?? "");
    const [senha, setSenha] = useState("");
    const [erroLocal, setErroLocal] = useState("");

    function enviar() {
        if (ocupado) return;
        if (!nome.trim() || !email.trim() || (!usuario && !senha)) {
            setErroLocal("Preencha todos os campos obrigatórios.");
            return;
        }
        setErroLocal("");
        salvar({ nome: nome.trim(), email: email.trim(), senha });
    }

    return (
        <Janela titulo={usuario ? "Editar usuário" : "Novo usuário"} fechar={fechar} ocupada={ocupado} rodape={
            <>
                <Erro mensagem={erroLocal || erro} />
                <Botao label={usuario ? "Salvar alterações" : "Criar usuário"} icon="checkmark" busy={ocupado} onPress={enviar} />
            </>
        }>
            <Campo label="Nome" value={nome} onChangeText={setNome} placeholder="Nome completo" autoCapitalize="words" maxLength={100} />
            <Campo label="E-mail" value={email} onChangeText={setEmail} placeholder="voce@email.com"
                keyboardType="email-address" autoCapitalize="none" autoCorrect={false} maxLength={100} />
            <CampoSenha label={usuario ? "Senha (opcional)" : "Senha"} value={senha} onChangeText={setSenha}
                placeholder={usuario ? "Deixe em branco para manter" : "Mínimo de 6 caracteres"}
                autoComplete="new-password" maxLength={72} onSubmitEditing={enviar} />
        </Janela>
    );
}

type DialogoUsuario = { tipo: "formulario"; usuario?: Usuario } | { tipo: "exclusao"; usuario: Usuario };

export function UsuariosScreen() {
    const { token, usuario: usuarioAtual, atualizarUsuarioLocal, sair } = useAuth();
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [erroLista, setErroLista] = useState("");
    const [dialogo, setDialogo] = useState<DialogoUsuario>();
    const [ocupado, setOcupado] = useState(false);
    const [erro, setErro] = useState("");

    const carregar = useCallback(async (refresh = false) => {
        if (!token) return;
        refresh ? setAtualizando(true) : setCarregando(true);
        setErroLista("");
        try {
            setUsuarios(await listarUsuariosRequest(token));
        } catch (falha) {
            if (falha instanceof ApiError && falha.status === 401) void sair();
            else setErroLista(falha instanceof ApiError ? falha.message : "Não foi possível carregar os usuários.");
        } finally {
            setCarregando(false);
            setAtualizando(false);
        }
    }, [sair, token]);

    useEffect(() => { void carregar(); }, [carregar]);

    function abrir(novoDialogo: DialogoUsuario) {
        setErro("");
        setDialogo(novoDialogo);
    }

    function fechar() {
        if (!ocupado) setDialogo(undefined);
    }

    async function salvar(dados?: UsuarioInput) {
        if (!token || !dialogo || ocupado) return;
        setOcupado(true);
        setErro("");
        try {
            if (dialogo.tipo === "exclusao") {
                await excluirUsuarioRequest(dialogo.usuario.id, token);
            } else if (dados) {
                if (dialogo.usuario) {
                    const atualizado = await atualizarUsuarioRequest(dialogo.usuario.id, {
                        nome: dados.nome,
                        email: dados.email,
                        senha: dados.senha || undefined
                    }, token);
                    if (atualizado.id === usuarioAtual?.id) await atualizarUsuarioLocal(atualizado);
                } else {
                    await criarUsuarioRequest(dados, token);
                }
            }
            setDialogo(undefined);
            await carregar(true);
        } catch (falha) {
            if (falha instanceof ApiError && falha.status === 401) void sair();
            else setErro(falha instanceof ApiError ? falha.message : "Não foi possível concluir a operação.");
        } finally {
            setOcupado(false);
        }
    }

    return (
        <>
            <ListaRegistros dados={usuarios} carregando={carregando} atualizando={atualizando} erro={erroLista}
                carregar={() => void carregar(true)} vazio={<Estado icon="people-outline" titulo="Nenhum usuário cadastrado" />}
                cabecalho={<Cabecalho titulo="Usuários" acao={
                    <Botao label="Novo usuário" icon="add" onPress={() => abrir({ tipo: "formulario" })} />
                } />}
                renderItem={({ item }) => {
                    const proprio = item.id === usuarioAtual?.id;
                    return (
                        <Registro inicio={
                            <View aria-hidden style={styles.avatar}>
                                <Text style={ui.rowTitle}>{item.nome.charAt(0).toUpperCase()}</Text>
                            </View>
                        } fim={
                            <View style={styles.actions}>
                                <BotaoIcone label={"Editar " + item.nome} icon="create-outline"
                                    onPress={() => abrir({ tipo: "formulario", usuario: item })} />
                                {!proprio && <BotaoIcone label={"Excluir " + item.nome} icon="trash-outline" cor={colors.danger}
                                    onPress={() => abrir({ tipo: "exclusao", usuario: item })} />}
                            </View>
                        }>
                            <View style={ui.wrap}>
                                <Text style={ui.rowTitle}>{item.nome}</Text>
                                {proprio && <Etiqueta label="Você" />}
                            </View>
                            <Text style={ui.muted}>{item.email}</Text>
                        </Registro>
                    );
                }} />
            {dialogo?.tipo === "formulario" && (
                <FormularioUsuario usuario={dialogo.usuario} erro={erro} ocupado={ocupado} fechar={fechar} salvar={dados => void salvar(dados)} />
            )}
            {dialogo?.tipo === "exclusao" && (
                <Confirmacao titulo="Excluir usuário?"
                    mensagem={"O usuário " + dialogo.usuario.nome + " e as contas vinculadas serão removidos."}
                    label="Excluir usuário" erro={erro} busy={ocupado} fechar={fechar} confirmar={() => void salvar()} />
            )}
        </>
    );
}

const styles = StyleSheet.create({
    avatar: { width: 40, height: 40, borderRadius: layout.controlRadius, backgroundColor: colors.infoSoft, alignItems: "center", justifyContent: "center" },
    actions: { flexDirection: "row" }
});
