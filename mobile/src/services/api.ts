import { Platform } from "react-native";
import {
    Agendamento,
    AgendamentoDetalhe,
    ApiValidationError,
    Categoria,
    Conta,
    LoginResponse,
    OperacaoTransacao,
    OrdenacaoTransacao,
    Periodicidade,
    StatusTransacao,
    TipoConta,
    Transacao,
    TransacaoResumo,
    Usuario
} from "../types";

const configurada = process.env.EXPO_PUBLIC_API_URL?.trim();
const enderecoPadrao = Platform.OS === "web"
    ? "http://localhost:3000"
    : "http://10.0.2.2:3000";

export const API_URL = (configurada || enderecoPadrao).replace(/\/$/, "");

interface ApiErrorBody {
    mensagem?: string;
    erros?: ApiValidationError[];
}

export class ApiError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly erros: ApiValidationError[] = []
    ) {
        super(message);
    }
}

export async function apiRequest<T>(
    path: string,
    options: RequestInit = {},
    token?: string | null
): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers
        }
    });

    const text = await response.text();
    const body = text ? JSON.parse(text) as ApiErrorBody | T : undefined;

    if (!response.ok) {
        const erro = body as ApiErrorBody | undefined;
        const detalhes = erro?.erros?.map(item => item.mensagem).join("\n");
        throw new ApiError(
            detalhes || erro?.mensagem || "Nao foi possivel concluir a operacao",
            response.status,
            erro?.erros
        );
    }

    return body as T;
}

export function loginRequest(email: string, senha: string) {
    return apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, senha })
    });
}

export function cadastroRequest(nome: string, email: string, senha: string) {
    return apiRequest<Usuario>("/auth/cadastro", {
        method: "POST",
        body: JSON.stringify({ nome, email, senha })
    });
}

export function listarUsuariosRequest(token: string) {
    return apiRequest<Usuario[]>("/usuarios", {}, token);
}

export function criarUsuarioRequest(
    dados: { nome: string; email: string; senha: string },
    token: string
) {
    return apiRequest<Usuario>("/usuarios", {
        method: "POST",
        body: JSON.stringify(dados)
    }, token);
}

export function atualizarUsuarioRequest(
    id: number,
    dados: { nome: string; email: string; senha?: string },
    token: string
) {
    return apiRequest<Usuario>(`/usuarios/${id}`, {
        method: "PUT",
        body: JSON.stringify(dados)
    }, token);
}

export function excluirUsuarioRequest(id: number, token: string) {
    return apiRequest<void>(`/usuarios/${id}`, { method: "DELETE" }, token);
}

export interface ContaInput {
    usuarioId: number;
    nome: string;
    instituicao?: string;
    tipo: TipoConta;
    saldo: number;
}

export function listarContasRequest(token: string) {
    return apiRequest<Conta[]>("/contas", {}, token);
}

export function criarContaRequest(dados: ContaInput, token: string) {
    return apiRequest<Conta>("/contas", {
        method: "POST",
        body: JSON.stringify(dados)
    }, token);
}

export function atualizarContaRequest(id: number, dados: ContaInput, token: string) {
    return apiRequest<Conta>(`/contas/${id}`, {
        method: "PUT",
        body: JSON.stringify(dados)
    }, token);
}

export function excluirContaRequest(id: number, token: string) {
    return apiRequest<void>(`/contas/${id}`, { method: "DELETE" }, token);
}

export function listarCategoriasRequest(token: string) {
    return apiRequest<Categoria[]>("/categorias", {}, token);
}

export interface TransacaoInput {
    contaId: number;
    categoriaId: number;
    titulo: string;
    descricao?: string;
    operacao: OperacaoTransacao;
    valor: number;
}

export interface TransacaoFiltro {
    inicio?: string;
    fim?: string;
    contaId?: number;
    status?: StatusTransacao;
    ordenarPor?: OrdenacaoTransacao;
    ordem?: "asc" | "desc";
}

export function listarTransacoesRequest(filtro: TransacaoFiltro, token: string) {
    const parametros = Object.entries(filtro)
        .filter(([, valor]) => valor !== undefined && valor !== "")
        .map(([chave, valor]) => `${chave}=${encodeURIComponent(String(valor))}`)
        .join("&");
    return apiRequest<TransacaoResumo[]>(`/transacoes${parametros ? `?${parametros}` : ""}`, {}, token);
}

export function buscarTransacaoRequest(id: number, token: string) {
    return apiRequest<Transacao>(`/transacoes/${id}`, {}, token);
}

export function criarTransacaoRequest(dados: TransacaoInput, token: string) {
    return apiRequest<Transacao>("/transacoes", {
        method: "POST",
        body: JSON.stringify(dados)
    }, token);
}

export function atualizarTransacaoRequest(id: number, dados: TransacaoInput, token: string) {
    return apiRequest<Transacao>(`/transacoes/${id}`, {
        method: "PUT",
        body: JSON.stringify(dados)
    }, token);
}

export function pagarTransacaoRequest(id: number, token: string) {
    return apiRequest<Transacao>(`/transacoes/${id}/pagar`, { method: "PATCH" }, token);
}

export function cancelarTransacaoRequest(id: number, token: string) {
    return apiRequest<Transacao>(`/transacoes/${id}/cancelar`, { method: "PATCH" }, token);
}

export function excluirTransacaoRequest(id: number, token: string) {
    return apiRequest<void>(`/transacoes/${id}`, { method: "DELETE" }, token);
}

// Agendamento não tem categoria: cada parcela é paga uma vez.
export type AgendamentoInput = Omit<TransacaoInput, "categoriaId"> & { primeiroVencimento: string } & (
    { tipo: "parcelado"; parcelas: number } |
    { tipo: "recorrente"; periodicidade: Periodicidade; ate?: string }
);

export function listarAgendamentosRequest(token: string) {
    return apiRequest<Agendamento[]>("/agendamentos", {}, token);
}

export function buscarAgendamentoRequest(id: number, token: string) {
    return apiRequest<AgendamentoDetalhe>(`/agendamentos/${id}`, {}, token);
}

export function salvarAgendamentoRequest(id: number | undefined, dados: AgendamentoInput, token: string) {
    return apiRequest<AgendamentoDetalhe>(id === undefined ? "/agendamentos" : `/agendamentos/${id}`, {
        method: id === undefined ? "POST" : "PUT",
        body: JSON.stringify(dados)
    }, token);
}

export function cancelarAgendamentoRequest(id: number, token: string) {
    return apiRequest<AgendamentoDetalhe>(`/agendamentos/${id}/cancelar`, { method: "PATCH" }, token);
}

export function excluirAgendamentoRequest(id: number, token: string) {
    return apiRequest<void>(`/agendamentos/${id}`, { method: "DELETE" }, token);
}
