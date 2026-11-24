import { AppError } from "../errors/app-error";
import { CategoriaRepository } from "../repositories/categoria-repository";

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

    criar(nome: string) {
        return this.repository.atomico(() => {
            this.validarNome(nome);
            return this.repository.criar(nome);
        });
    }

    atualizar(id: number, nome: string) {
        return this.repository.atomico(() => {
            this.buscarPorId(id);
            this.validarNome(nome, id);
            return this.repository.atualizar(id, nome);
        });
    }

    excluir(id: number) {
        this.repository.atomico(() => {
            this.buscarPorId(id);
            if (this.repository.emUso(id)) {
                throw new AppError("A categoria está vinculada a transações ou agendamentos", 409);
            }
            this.repository.excluir(id);
        });
    }

    private validarNome(nome: string, ignorarId?: number) {
        const chave = nome.toLocaleLowerCase("pt-BR");
        const existe = this.repository.listar().some(categoria =>
            categoria.id !== ignorarId && categoria.nome.normalize("NFC").toLocaleLowerCase("pt-BR") === chave
        );
        if (existe) throw new AppError("Já existe uma categoria com esse nome", 409);
    }
}
