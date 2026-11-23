import { CategoriaRepositorySqlite } from "./repositories/categoria-repository-sqlite";
import { ContaRepositorySqlite } from "./repositories/conta-repository-sqlite";
import { TransacaoRepositorySqlite } from "./repositories/transacao-repository-sqlite";
import { UsuarioRepositorySqlite } from "./repositories/usuario-repository-sqlite";
import { AuthService } from "./services/auth-service";
import { CategoriaService } from "./services/categoria-service";
import { ContaService } from "./services/conta-service";
import { TransacaoService } from "./services/transacao-service";
import { UsuarioService } from "./services/usuario-service";

const usuarioRepository = new UsuarioRepositorySqlite();
const contaRepository = new ContaRepositorySqlite();
const categoriaRepository = new CategoriaRepositorySqlite();
const transacaoRepository = new TransacaoRepositorySqlite();

export const usuarioService = new UsuarioService(usuarioRepository, transacaoRepository);
export const authService = new AuthService(usuarioRepository);
export const contaService = new ContaService(contaRepository, usuarioRepository, transacaoRepository);
export const categoriaService = new CategoriaService(categoriaRepository);
export const transacaoService = new TransacaoService(transacaoRepository, contaRepository, categoriaRepository);
