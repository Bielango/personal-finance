import { UsuarioRepositorySqlite } from "./repositories/usuario-repository-sqlite";
import { AuthService } from "./services/auth-service";
import { UsuarioService } from "./services/usuario-service";

const usuarioRepository = new UsuarioRepositorySqlite();
export const usuarioService = new UsuarioService(usuarioRepository);
export const authService = new AuthService(usuarioRepository);
