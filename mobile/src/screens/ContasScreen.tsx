import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
    Botao, BotaoIcone, Cabecalho, Campo, Confirmacao, Erro, Estado,
    Icone, Indicadores, Janela, ListaRegistros, Registro, Seletor, ui, Valor
} from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { converterValor, formatarMoeda } from "../formatacao";
import {
    ApiError, atualizarContaRequest, ContaInput, criarContaRequest,
    excluirContaRequest, listarContasRequest, listarUsuariosRequest
} from "../services/api";
import { colors } from "../theme";
import { Conta, TipoConta, Usuario } from "../types";

const tiposConta = [
    { valor: "corrente", label: "Corrente", icon: "card-outline" },
    { valor: "poupanca", label: "Poupança", icon: "save-outline" },
    { valor: "investimento", label: "Investimento", icon: "trending-up-outline" },
    { valor: "carteira", label: "Carteira", icon: "wallet-outline" }
] as const;

function FormularioConta({ conta, usuarios, usuarioAtual, salvar, fechar, erro, ocupado }: {
    conta?: Conta;
    usuarios: Usuario[];
    usuarioAtual?: number;
    salvar: (dados: ContaInput) => void;
    fechar: () => void;
    erro: string;
    ocupado: boolean;
}) {
    const [usuarioId, setUsuarioId] = useState(conta?.usuarioId ?? usuarioAtual ?? usuarios[0]?.id ?? null);
    const [nome, setNome] = useState(conta?.nome ?? "");
    const [instituicao, setInstituicao] = useState(conta?.instituicao ?? "");
    const [tipo, setTipo] = useState<TipoConta>(conta?.tipo ?? "corrente");
    const [saldo, setSaldo] = useState(conta ? String(conta.saldo).replace(".", ",") : "");
    const [seletor, setSeletor] = useState<"usuario" | "tipo" | null>(null);
    const [erroLocal, setErroLocal] = useState("");

    function enviar() {
        if (ocupado) return;
        const saldoNumerico = converterValor(saldo);
        if (!usuarioId || !nome.trim() || saldoNumerico === null) {
            setErroLocal("Informe o responsável, o nome e um saldo válido.");
            return;
        }
        setErroLocal("");
        salvar({
            usuarioId,
            nome: nome.trim(),
            instituicao: instituicao.trim() || undefined,
            tipo,
            saldo: saldoNumerico
        });
    }

    return (
        <Janela titulo={conta ? "Editar conta" : "Nova conta"} fechar={fechar} ocupada={ocupado} rodape={
            <>
                <Erro mensagem={erroLocal || erro} />
                <Botao label={conta ? "Salvar alterações" : "Criar conta"} icon="checkmark" busy={ocupado} onPress={enviar} />
            </>
        }>
            <Campo label="Nome da conta" value={nome} onChangeText={setNome} placeholder="Ex.: Conta principal" maxLength={100} />
            <Campo label="Instituição (opcional)" value={instituicao} onChangeText={setInstituicao} placeholder="Ex.: Nome do banco" maxLength={100} />
            <Seletor label="Tipo" valor={tipo} opcoes={tiposConta}
                aberto={seletor === "tipo"} alternar={() => setSeletor(seletor === "tipo" ? null : "tipo")}
                selecionar={novoTipo => { setTipo(novoTipo); setSeletor(null); }} />
            <Seletor label="Responsável" valor={usuarioId} placeholder="Selecione um usuário"
                opcoes={usuarios.map(usuario => ({ valor: usuario.id, label: usuario.nome, descricao: usuario.email }))}
                aberto={seletor === "usuario"} alternar={() => setSeletor(seletor === "usuario" ? null : "usuario")}
                selecionar={id => { setUsuarioId(id); setSeletor(null); }} />
            <Campo label="Saldo (R$)" value={saldo} onChangeText={setSaldo} placeholder="0,00" keyboardType="decimal-pad"
                onSubmitEditing={enviar} />
        </Janela>
    );
}

type DialogoConta = { tipo: "formulario"; conta?: Conta } | { tipo: "exclusao"; conta: Conta };

export function ContasScreen() {
    const { token, usuario: usuarioLogado, sair } = useAuth();
    const [contas, setContas] = useState<Conta[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [erroLista, setErroLista] = useState("");
    const [dialogo, setDialogo] = useState<DialogoConta>();
    const [ocupado, setOcupado] = useState(false);
    const [erro, setErro] = useState("");

    const carregar = useCallback(async (refresh = false) => {
        if (!token) return;
        refresh ? setAtualizando(true) : setCarregando(true);
        setErroLista("");
        try {
            const [contasAtuais, usuariosAtuais] = await Promise.all([
                listarContasRequest(token), listarUsuariosRequest(token)
            ]);
            setContas(contasAtuais);
            setUsuarios(usuariosAtuais);
        } catch (falha) {
            if (falha instanceof ApiError && falha.status === 401) void sair();
            else setErroLista(falha instanceof ApiError ? falha.message : "Não foi possível carregar as contas.");
        } finally {
            setCarregando(false);
            setAtualizando(false);
        }
    }, [sair, token]);

    useEffect(() => { void carregar(); }, [carregar]);

    function abrir(novoDialogo: DialogoConta) {
        setErro("");
        setDialogo(novoDialogo);
    }

    function fechar() {
        if (!ocupado) setDialogo(undefined);
    }

    async function salvar(dados?: ContaInput) {
        if (!token || !dialogo || ocupado) return;
        setOcupado(true);
        setErro("");
        try {
            if (dialogo.tipo === "exclusao") {
                await excluirContaRequest(dialogo.conta.id, token);
            } else if (dados) {
                if (dialogo.conta) await atualizarContaRequest(dialogo.conta.id, dados, token);
                else await criarContaRequest(dados, token);
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

    const saldo = contas.reduce((total, conta) => total + Math.round(conta.saldo * 100), 0) / 100;
    return (
        <>
            <ListaRegistros dados={contas} carregando={carregando} atualizando={atualizando} erro={erroLista}
                carregar={() => void carregar(true)} vazio={<Estado icon="wallet-outline" titulo="Nenhuma conta cadastrada" />}
                cabecalho={
                    <>
                        <Cabecalho titulo="Contas" acao={<Botao label="Nova conta" icon="add" disabled={carregando || !!erroLista}
                            onPress={() => abrir({ tipo: "formulario" })} />} />
                        {!carregando && !erroLista && <Indicadores itens={[
                            { label: "Saldo total das contas", valor: formatarMoeda(saldo), cor: saldo < 0 ? colors.danger : undefined },
                            { label: "Contas cadastradas", valor: String(contas.length) }
                        ]} />}
                    </>
                }
                renderItem={({ item }) => {
                    const tipo = tiposConta.find(opcao => opcao.valor === item.tipo) ?? tiposConta[0];
                    return (
                        <Registro inicio={<Icone icon={tipo.icon} />} fim={
                            <View style={ui.recordEnd}>
                                <Valor valor={item.saldo} cor={item.saldo < 0 ? colors.danger : undefined} />
                                <View style={styles.actions}>
                                    <BotaoIcone label={"Editar " + item.nome} icon="create-outline" onPress={() => abrir({ tipo: "formulario", conta: item })} />
                                    <BotaoIcone label={"Excluir " + item.nome} icon="trash-outline" cor={colors.danger}
                                        onPress={() => abrir({ tipo: "exclusao", conta: item })} />
                                </View>
                            </View>
                        }>
                            <Text style={ui.rowTitle}>{item.nome}</Text>
                            <Text style={ui.muted}>{[item.instituicao, tipo.label, item.usuarioNome].filter(Boolean).join(" · ")}</Text>
                        </Registro>
                    );
                }} />
            {dialogo?.tipo === "formulario" && (
                <FormularioConta conta={dialogo.conta} usuarios={usuarios} usuarioAtual={usuarioLogado?.id}
                    erro={erro} ocupado={ocupado} fechar={fechar} salvar={dados => void salvar(dados)} />
            )}
            {dialogo?.tipo === "exclusao" && (
                <Confirmacao titulo="Excluir conta?" mensagem={"A conta " + dialogo.conta.nome + " será removida."}
                    label="Excluir conta" erro={erro} busy={ocupado} fechar={fechar} confirmar={() => void salvar()} />
            )}
        </>
    );
}

const styles = StyleSheet.create({
    actions: { flexDirection: "row" }
});
