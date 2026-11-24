import { Router } from "express";
import {
    atualizarCategoria, buscarCategoria, criarCategoria, excluirCategoria, listarCategorias
} from "../controllers/categorias-controller";
import { validar } from "../middlewares/validar";
import { categoriaInputSchema } from "../schemas/categoria-schema";
import { transacaoIdSchema } from "../schemas/transacao-schema";

const categoriasRoutes = Router();
const validarId = validar(transacaoIdSchema, "params");
const validarDados = validar(categoriaInputSchema, "body");

/**
 * @openapi
 * /categorias:
 *   get:
 *     summary: Lista as categorias
 *     tags: [Categorias]
 *     responses:
 *       200:
 *         description: Lista de categorias
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Categoria'
 *       401:
 *         description: Token ausente, inválido ou expirado
 *   post:
 *     summary: Cria uma categoria
 *     tags: [Categorias]
 *     requestBody:
 *       $ref: '#/components/requestBodies/CategoriaInput'
 *     responses:
 *       201:
 *         description: Categoria criada
 *       409:
 *         description: Nome já utilizado
 * /categorias/{id}:
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: integer
 *   get:
 *     summary: Busca uma categoria
 *     tags: [Categorias]
 *     responses:
 *       200:
 *         description: Categoria encontrada
 *       404:
 *         description: Categoria inexistente
 *   put:
 *     summary: Renomeia uma categoria
 *     tags: [Categorias]
 *     requestBody:
 *       $ref: '#/components/requestBodies/CategoriaInput'
 *     responses:
 *       200:
 *         description: Categoria atualizada
 *       409:
 *         description: Nome já utilizado
 *   delete:
 *     summary: Exclui uma categoria sem vínculos
 *     tags: [Categorias]
 *     responses:
 *       204:
 *         description: Categoria excluída
 *       409:
 *         description: Categoria em uso
 */
categoriasRoutes.get("/", listarCategorias);
categoriasRoutes.get("/:id", validarId, buscarCategoria);
categoriasRoutes.post("/", validarDados, criarCategoria);
categoriasRoutes.put("/:id", validarId, validarDados, atualizarCategoria);
categoriasRoutes.delete("/:id", validarId, excluirCategoria);

export { categoriasRoutes };
