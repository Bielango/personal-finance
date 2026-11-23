import { Router } from "express";
import { listarCategorias } from "../controllers/categorias-controller";

const categoriasRoutes = Router();

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
 */
categoriasRoutes.get("/", listarCategorias);

export { categoriasRoutes };
