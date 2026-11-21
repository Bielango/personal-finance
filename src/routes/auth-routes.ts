import { Router } from "express";
import { login, usuarioAutenticado } from "../controllers/auth-controller";
import { criarPrimeiroUsuario } from "../controllers/usuarios-controller";
import { autenticar } from "../middlewares/autenticar";
import { validar } from "../middlewares/validar";
import { loginSchema, usuarioInputSchema } from "../schemas/usuario-schema";

const authRoutes = Router();

/**
 * @openapi
 * /auth/cadastro:
 *   post:
 *     summary: Cadastra o primeiro usuario do sistema
 *     tags: [Autenticacao]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioInput'
 *     responses:
 *       201:
 *         description: Primeiro usuario cadastrado
 *       400:
 *         description: Dados invalidos
 *       403:
 *         description: O primeiro usuario ja foi cadastrado
 */
authRoutes.post("/cadastro", validar(usuarioInputSchema, "body"), criarPrimeiroUsuario);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Autentica o usuário e devolve o token JWT
 *     tags: [Autenticação]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login realizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResposta'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroValidacao'
 *       401:
 *         description: Email ou senha inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MensagemErro'
 */
authRoutes.post("/login", validar(loginSchema, "body"), login);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Retorna o usuário autenticado
 *     tags: [Autenticação]
 *     responses:
 *       200:
 *         description: Usuário autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: Token ausente, inválido ou expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MensagemErro'
 */
authRoutes.get("/me", autenticar, usuarioAutenticado);

export { authRoutes };
