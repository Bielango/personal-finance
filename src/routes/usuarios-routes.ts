import { Router } from "express";
import {
    atualizarUsuario,
    buscarUsuarioPorId,
    criarUsuario,
    excluirUsuario,
    listarUsuarios
} from "../controllers/usuarios-controller";
import { validar } from "../middlewares/validar";
import {
    usuarioAtualizacaoSchema,
    usuarioIdSchema,
    usuarioInputSchema
} from "../schemas/usuario-schema";

const usuariosRoutes = Router();

/**
 * @openapi
 * /usuarios:
 *   get:
 *     summary: Lista os usuarios
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Usuario'
 */
usuariosRoutes.get("/", listarUsuarios);

/**
 * @openapi
 * /usuarios/{id}:
 *   get:
 *     summary: Busca um usuario pelo ID
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *       404:
 *         description: Usuario nao encontrado
 */
usuariosRoutes.get("/:id", validar(usuarioIdSchema, "params"), buscarUsuarioPorId);

/**
 * @openapi
 * /usuarios:
 *   post:
 *     summary: Cadastra um usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioInput'
 *     responses:
 *       201:
 *         description: Usuario cadastrado
 *       409:
 *         description: Email ja cadastrado
 */
usuariosRoutes.post("/", validar(usuarioInputSchema, "body"), criarUsuario);

/**
 * @openapi
 * /usuarios/{id}:
 *   put:
 *     summary: Atualiza um usuario
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioAtualizacaoInput'
 *     responses:
 *       200:
 *         description: Usuario atualizado
 *       404:
 *         description: Usuario nao encontrado
 *       409:
 *         description: Email ja cadastrado
 */
usuariosRoutes.put(
    "/:id",
    validar(usuarioIdSchema, "params"),
    validar(usuarioAtualizacaoSchema, "body"),
    atualizarUsuario
);

/**
 * @openapi
 * /usuarios/{id}:
 *   delete:
 *     summary: Exclui um usuario
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Usuario excluido
 *       404:
 *         description: Usuario nao encontrado
 *       409:
 *         description: Nao e permitido excluir o proprio usuario
 */
usuariosRoutes.delete("/:id", validar(usuarioIdSchema, "params"), excluirUsuario);

export { usuariosRoutes };
