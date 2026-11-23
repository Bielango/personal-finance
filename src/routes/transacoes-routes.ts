import { Router } from "express";
import {
    atualizarTransacao,
    buscarTransacaoPorId,
    cancelarTransacao,
    criarTransacao,
    excluirTransacao,
    listarTransacoes,
    pagarTransacao
} from "../controllers/transacoes-controller";
import { validar } from "../middlewares/validar";
import {
    transacaoFiltroSchema,
    transacaoIdSchema,
    transacaoInputSchema
} from "../schemas/transacao-schema";

const transacoesRoutes = Router();

/**
 * @openapi
 * /transacoes:
 *   get:
 *     summary: Lista as transações (sem a descrição)
 *     description: Por padrão, da mais nova para a mais antiga. Todos os filtros são opcionais.
 *     tags: [Transações]
 *     parameters:
 *       - in: query
 *         name: inicio
 *         schema: { type: string, format: date, example: "2026-11-01" }
 *         description: Data inicial (criação da transação)
 *       - in: query
 *         name: fim
 *         schema: { type: string, format: date, example: "2026-11-30" }
 *         description: Data final, inclusive
 *       - in: query
 *         name: contaId
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [a, p, c] }
 *         description: a = ativa, p = paga, c = cancelada
 *       - in: query
 *         name: ordenarPor
 *         schema:
 *           type: string
 *           enum: [data, codigo, status, categoria, operacao, valor, conta]
 *           default: data
 *       - in: query
 *         name: ordem
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Lista de transações
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TransacaoResumo'
 *       400:
 *         description: Filtro inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroValidacao'
 */
transacoesRoutes.get("/", validar(transacaoFiltroSchema, "query"), listarTransacoes);

/**
 * @openapi
 * /transacoes/{id}:
 *   get:
 *     summary: Busca uma transação, com a descrição
 *     tags: [Transações]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Transação encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transacao'
 *       404:
 *         description: Transação não encontrada
 */
transacoesRoutes.get("/:id", validar(transacaoIdSchema, "params"), buscarTransacaoPorId);

/**
 * @openapi
 * /transacoes:
 *   post:
 *     summary: Cadastra uma transação (começa ativa)
 *     tags: [Transações]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransacaoInput'
 *     responses:
 *       201:
 *         description: Transação cadastrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transacao'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroValidacao'
 *       404:
 *         description: Conta ou categoria não encontrada
 */
transacoesRoutes.post("/", validar(transacaoInputSchema, "body"), criarTransacao);

/**
 * @openapi
 * /transacoes/{id}:
 *   put:
 *     summary: Atualiza uma transação ativa ou paga (não mexe no saldo)
 *     tags: [Transações]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransacaoInput'
 *     responses:
 *       200:
 *         description: Transação atualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transacao'
 *       400:
 *         description: Dados ou ID inválidos
 *       404:
 *         description: Transação, conta ou categoria não encontrada
 *       409:
 *         description: Transação cancelada não pode ser editada
 */
transacoesRoutes.put(
    "/:id",
    validar(transacaoIdSchema, "params"),
    validar(transacaoInputSchema, "body"),
    atualizarTransacao
);

/**
 * @openapi
 * /transacoes/{id}/pagar:
 *   patch:
 *     summary: Paga a transação e lança o valor no saldo da conta
 *     description: Recebimento (+) soma e gasto (-) subtrai. Uma transação paga pode ser paga de novo.
 *     tags: [Transações]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Transação paga
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transacao'
 *       404:
 *         description: Transação não encontrada
 *       409:
 *         description: Transação cancelada não pode ser paga
 */
transacoesRoutes.patch("/:id/pagar", validar(transacaoIdSchema, "params"), pagarTransacao);

/**
 * @openapi
 * /transacoes/{id}/cancelar:
 *   patch:
 *     summary: Cancela a transação (o que já foi pago não volta)
 *     tags: [Transações]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Transação cancelada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transacao'
 *       404:
 *         description: Transação não encontrada
 *       409:
 *         description: A transação já está cancelada
 */
transacoesRoutes.patch("/:id/cancelar", validar(transacaoIdSchema, "params"), cancelarTransacao);

/**
 * @openapi
 * /transacoes/{id}:
 *   delete:
 *     summary: Exclui uma transação cancelada
 *     tags: [Transações]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: Transação excluída
 *       404:
 *         description: Transação não encontrada
 *       409:
 *         description: Só é possível excluir transações canceladas
 */
transacoesRoutes.delete("/:id", validar(transacaoIdSchema, "params"), excluirTransacao);

export { transacoesRoutes };
