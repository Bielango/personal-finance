import { Router } from "express";
import { criarUsuario } from "../controllers/usuarios-controller";
import { validar } from "../middlewares/validar";
import { usuarioInputSchema } from "../schemas/usuario-schema";

const usuariosRoutes = Router();

/**
 * @openapi
 * /usuarios:
 *   post:
 *     summary: Cadastra o usuário do sistema
 *     description: O sistema tem um único usuário. O cadastro só funciona enquanto ainda não houver ninguém cadastrado.
 *     tags: [Usuário]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioInput'
 *     responses:
 *       201:
 *         description: Usuário cadastrado (a resposta não traz a senha)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroValidacao'
 *       403:
 *         description: Já existe um usuário cadastrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MensagemErro'
 */
usuariosRoutes.post("/", validar(usuarioInputSchema, "body"), criarUsuario);

export { usuariosRoutes };
