import { Categoria } from "../models/categoria";

export interface CategoriaRepository {
    listar(): Categoria[];
    buscarPorId(id: number): Categoria | null;
}
