import { Usuario, UsuarioCredenciais } from "../models/usuario";
import { UsuarioInput } from "../schemas/usuario-schema";

export interface UsuarioRepository {
    contar(): number;
    buscarPorId(id: number): Usuario | null;
    buscarCredenciaisPorEmail(email: string): UsuarioCredenciais | null;
    criar(dados: UsuarioInput): Usuario;
}
