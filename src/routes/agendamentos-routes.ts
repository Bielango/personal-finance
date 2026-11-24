import { Router } from "express";
import {
    atualizarAgendamento, buscarAgendamento, cancelarAgendamento,
    criarAgendamento, excluirAgendamento, listarAgendamentos
} from "../controllers/agendamentos-controller";
import { validar } from "../middlewares/validar";
import { agendamentoInputSchema } from "../schemas/agendamento-schema";
import { transacaoIdSchema } from "../schemas/transacao-schema";

const agendamentosRoutes = Router();
const validarId = validar(transacaoIdSchema, "params");
const validarDados = validar(agendamentoInputSchema, "body");

/**
 * @openapi
 * /agendamentos:
 *   get:
 *     summary: Lista agendamentos e seus próximos vencimentos
 *     tags: [Agendamentos]
 *     responses:
 *       200:
 *         description: Lista de agendamentos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Agendamento'
 *   post:
 *     summary: Cria um agendamento e gera suas primeiras transações
 *     tags: [Agendamentos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AgendamentoInput'
 *     responses:
 *       201:
 *         description: Agendamento criado com as ocorrências
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AgendamentoDetalhe'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Conta ou categoria inexistente
 * /agendamentos/{id}:
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: integer
 *   get:
 *     summary: Busca um agendamento com as transações vinculadas
 *     tags: [Agendamentos]
 *     responses:
 *       200:
 *         description: Agendamento com as ocorrências
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AgendamentoDetalhe'
 *       404:
 *         description: Agendamento inexistente
 *   put:
 *     summary: Edita um agendamento ativo sem pagamentos
 *     tags: [Agendamentos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AgendamentoInput'
 *     responses:
 *       200:
 *         description: Agendamento atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AgendamentoDetalhe'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Agendamento, conta ou categoria inexistente
 *       409:
 *         description: O agendamento tem pagamentos ou está cancelado
 *   delete:
 *     summary: Exclui um agendamento cancelado sem pagamentos
 *     tags: [Agendamentos]
 *     responses:
 *       204:
 *         description: Agendamento excluído
 *       404:
 *         description: Agendamento inexistente
 *       409:
 *         description: O agendamento está ativo ou tem pagamentos
 * /agendamentos/{id}/cancelar:
 *   patch:
 *     summary: Cancela o agendamento e os vencimentos pendentes
 *     tags: [Agendamentos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Agendamento cancelado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AgendamentoDetalhe'
 *       404:
 *         description: Agendamento inexistente
 *       409:
 *         description: Agendamento já cancelado ou concluído
 */
agendamentosRoutes.get("/", listarAgendamentos);
agendamentosRoutes.post("/", validarDados, criarAgendamento);
agendamentosRoutes.get("/:id", validarId, buscarAgendamento);
agendamentosRoutes.put("/:id", validarId, validarDados, atualizarAgendamento);
agendamentosRoutes.patch("/:id/cancelar", validarId, cancelarAgendamento);
agendamentosRoutes.delete("/:id", validarId, excluirAgendamento);

export { agendamentosRoutes };
