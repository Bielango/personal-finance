import { Router } from "express";
import {
    atualizarConta,
    buscarContaPorId,
    criarConta,
    excluirConta,
    listarContas
} from "../controllers/contas-controller";
import { validar } from "../middlewares/validar";
import { contaIdSchema, contaInputSchema } from "../schemas/conta-schema";

const contasRoutes = Router();

/**
 * @openapi
 * /contas:
 *   get:
 *     summary: Lista as contas do usuario autenticado
 *     tags: [Contas]
 *     responses:
 *       200:
 *         description: Lista de contas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Conta'
 *       401:
 *         description: Token ausente, invalido ou expirado
 */
contasRoutes.get("/", listarContas);

/**
 * @openapi
 * /contas/{id}:
 *   get:
 *     summary: Busca uma conta pelo ID
 *     tags: [Contas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Conta encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conta'
 *       400:
 *         description: ID invalido
 *       404:
 *         description: Conta nao encontrada
 */
contasRoutes.get("/:id", validar(contaIdSchema, "params"), buscarContaPorId);

/**
 * @openapi
 * /contas:
 *   post:
 *     summary: Cadastra uma conta
 *     tags: [Contas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContaInput'
 *     responses:
 *       201:
 *         description: Conta cadastrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conta'
 *       400:
 *         description: Dados invalidos
 *       409:
 *         description: Nome de conta ja utilizado
 */
contasRoutes.post("/", validar(contaInputSchema, "body"), criarConta);

/**
 * @openapi
 * /contas/{id}:
 *   put:
 *     summary: Atualiza uma conta
 *     tags: [Contas]
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
 *             $ref: '#/components/schemas/ContaInput'
 *     responses:
 *       200:
 *         description: Conta atualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conta'
 *       400:
 *         description: Dados ou ID invalidos
 *       404:
 *         description: Conta nao encontrada
 *       409:
 *         description: Nome de conta ja utilizado
 */
contasRoutes.put(
    "/:id",
    validar(contaIdSchema, "params"),
    validar(contaInputSchema, "body"),
    atualizarConta
);

/**
 * @openapi
 * /contas/{id}:
 *   delete:
 *     summary: Exclui uma conta
 *     tags: [Contas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Conta excluida
 *       400:
 *         description: ID invalido
 *       404:
 *         description: Conta nao encontrada
 */
contasRoutes.delete("/:id", validar(contaIdSchema, "params"), excluirConta);

export { contasRoutes };
