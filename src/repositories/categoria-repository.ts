import { Categoria } from "../models/categoria";

export interface CategoriaRepository {
    atomico<T>(operacao: () => T): T;
    listar(): Categoria[];
    buscarPorId(id: number): Categoria | null;
    criar(nome: string): Categoria;
    atualizar(id: number, nome: string): Categoria;
    excluir(id: number): void;
    emUso(id: number): boolean;
}
