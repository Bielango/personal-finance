import { Usuario, UsuarioCredenciais } from "../models/usuario";
import { UsuarioAtualizacaoInput, UsuarioInput } from "../schemas/usuario-schema";

export interface UsuarioRepository {
    contar(): number;
    listar(): Usuario[];
    buscarPorId(id: number): Usuario | null;
    buscarCredenciaisPorEmail(email: string): UsuarioCredenciais | null;
    emailEmUso(email: string, ignorarId?: number): boolean;
    criar(dados: UsuarioInput): Usuario;
    atualizar(id: number, dados: UsuarioAtualizacaoInput): Usuario | null;
    excluir(id: number): boolean;
}
