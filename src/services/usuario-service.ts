import { AppError } from "../errors/app-error";
import { UsuarioRepository } from "../repositories/usuario-repository";
import { UsuarioInput } from "../schemas/usuario-schema";

export class UsuarioService {
    constructor(private readonly repository: UsuarioRepository) {}

    buscarPorId(id: number) {
        const usuario = this.repository.buscarPorId(id);
        if (!usuario) throw new AppError("Usuário não encontrado", 404);
        return usuario;
    }

    // O sistema é de um único usuário: o cadastro só funciona enquanto não houver ninguém.
    criar(dados: UsuarioInput) {
        if (this.repository.contar() > 0) {
            throw new AppError("Já existe um usuário cadastrado. Faça login.", 403);
        }
        return this.repository.criar(dados);
    }
}
