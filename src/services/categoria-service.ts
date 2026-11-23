import { CategoriaRepository } from "../repositories/categoria-repository";

export class CategoriaService {
    constructor(private readonly repository: CategoriaRepository) {}

    listar() {
        return this.repository.listar();
    }
}
