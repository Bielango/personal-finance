import { Router } from "express";
import { buscarCategoria, listarCategorias } from "../controllers/categorias-controller";
import { validar } from "../middlewares/validar";
import { transacaoIdSchema } from "../schemas/transacao-schema";

const categoriasRoutes = Router();

/**
 * @openapi
 * /categorias:
 *   get:
 *     summary: Lista as categorias fixas (Única e Recorrente)
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
 * /categorias/{id}:
 *   get:
 *     summary: Busca uma categoria
 *     tags: [Categorias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Categoria encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Categoria'
 *       404:
 *         description: Categoria inexistente
 */
categoriasRoutes.get("/", listarCategorias);
categoriasRoutes.get("/:id", validar(transacaoIdSchema, "params"), buscarCategoria);

export { categoriasRoutes };
