import { Conta } from "../models/conta";
import { ContaInput } from "../schemas/conta-schema";

export interface ContaRepository {
    listar(): Conta[];
    buscarPorId(id: number): Conta | null;
    nomeEmUso(nome: string, usuarioId: number, ignorarId?: number): boolean;
    criar(dados: ContaInput): Conta;
    atualizar(id: number, dados: ContaInput): Conta | null;
    excluir(id: number): boolean;
}
