import { Conta } from "../models/conta";
import { ContaInput } from "../schemas/conta-schema";

export interface ContaRepository {
    listar(usuarioId: number): Conta[];
    buscarPorId(id: number, usuarioId: number): Conta | null;
    nomeEmUso(nome: string, usuarioId: number, ignorarId?: number): boolean;
    criar(dados: ContaInput, usuarioId: number): Conta;
    atualizar(id: number, dados: ContaInput, usuarioId: number): Conta | null;
    excluir(id: number, usuarioId: number): boolean;
}
