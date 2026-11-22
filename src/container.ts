import { ContaRepositorySqlite } from "./repositories/conta-repository-sqlite";
import { UsuarioRepositorySqlite } from "./repositories/usuario-repository-sqlite";
import { AuthService } from "./services/auth-service";
import { ContaService } from "./services/conta-service";
import { UsuarioService } from "./services/usuario-service";

const usuarioRepository = new UsuarioRepositorySqlite();
export const usuarioService = new UsuarioService(usuarioRepository);
export const authService = new AuthService(usuarioRepository);

const contaRepository = new ContaRepositorySqlite();
export const contaService = new ContaService(contaRepository, usuarioRepository);
