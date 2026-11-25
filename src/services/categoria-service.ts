import { AppError } from "../errors/app-error";
import { CategoriaRepository } from "../repositories/categoria-repository";

// As categorias são fixas (Única e Recorrente), então só há consulta.
export class CategoriaService {
    constructor(private readonly repository: CategoriaRepository) {}

    listar() {
        return this.repository.listar();
    }

    buscarPorId(id: number) {
        const categoria = this.repository.buscarPorId(id);
        if (!categoria) throw new AppError("Categoria não encontrada", 404);
        return categoria;
    }
}
