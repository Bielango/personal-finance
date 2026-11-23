# Personal Finance

API de gestão financeira pessoal.

Para trabalhar no código (organização, convenções e como criar um módulo novo), veja o [Guia do projeto](GUIA.md).

## Tecnologias

- Node.js 22.5+ e TypeScript
- Express 5
- SQLite (`node:sqlite`, nativo do Node)
- Zod (validação)
- JWT + bcrypt (autenticação)
- Swagger (documentação)

## Como rodar

```bash
npm install
cp .env.example .env   # depois troque o JWT_SECRET
npm run dev
```

- API: `http://localhost:3000`
- Documentação (Swagger): `http://localhost:3000/docs`

O banco (`personal-finance.db`) é criado automaticamente na primeira execução.

## Autenticação

O primeiro acesso é criado por uma rota pública. Depois disso, o CRUD de usuários exige autenticação.

1. `POST /auth/cadastro` cadastra o primeiro usuário (só funciona enquanto não houver nenhum).
2. `POST /auth/login` devolve o token.
3. Nas rotas protegidas, envie o header `Authorization: Bearer <token>`.

| Método | Rota | Descrição | Token |
|---|---|---|---|
| POST | `/auth/cadastro` | Cadastra o primeiro usuário | Não |
| POST | `/auth/login` | Faz login e devolve o token JWT | Não |
| GET | `/auth/me` | Dados do usuário logado | Sim |

## Usuários

| Método | Rota | Descrição | Token |
|---|---|---|---|
| GET | `/usuarios` | Lista os usuários | Sim |
| GET | `/usuarios/:id` | Busca um usuário | Sim |
| POST | `/usuarios` | Cadastra um usuário | Sim |
| PUT | `/usuarios/:id` | Atualiza um usuário | Sim |
| DELETE | `/usuarios/:id` | Exclui um usuário | Sim |

## Contas

Cada conta pertence ao usuário escolhido no cadastro. Todos os usuários autenticados podem visualizar e administrar as contas. O saldo é recebido em reais pela API e armazenado em centavos no SQLite.

Tipos aceitos: `corrente`, `poupanca`, `investimento` e `carteira`.

| Método | Rota | Descrição | Token |
|---|---|---|---|
| GET | `/contas` | Lista as contas do usuário | Sim |
| GET | `/contas/:id` | Busca uma conta do usuário | Sim |
| POST | `/contas` | Cadastra uma conta | Sim |
| PUT | `/contas/:id` | Atualiza uma conta | Sim |
| DELETE | `/contas/:id` | Exclui uma conta | Sim |

Uma conta que tem transações não pode ser excluída, nem o usuário dono dela.

## Categorias

| Método | Rota | Descrição | Token |
|---|---|---|---|
| GET | `/categorias` | Lista as categorias | Sim |

O banco já começa com três categorias: `Única`, `Recorrente` e `Parcelada`.

## Transações

Cada transação é um recebimento (`+`) ou um gasto (`-`) de uma conta. O valor é sempre positivo, e a operação define se ele entra ou sai da conta.

| Status | Significado | Pode |
|---|---|---|
| `a` | ativa (ao criar) | pagar, editar, cancelar |
| `p` | paga | pagar de novo, editar, cancelar |
| `c` | cancelada | excluir |

- **Pagar** lança o valor no saldo da conta. Cada pagamento lança o valor de novo, e o saldo pode ficar negativo.
- **Editar** não mexe no saldo.
- **Cancelar** não devolve o que já foi pago.

| Método | Rota | Descrição | Token |
|---|---|---|---|
| GET | `/transacoes` | Lista as transações, sem a descrição | Sim |
| GET | `/transacoes/:id` | Busca uma transação, com a descrição | Sim |
| POST | `/transacoes` | Cadastra uma transação | Sim |
| PUT | `/transacoes/:id` | Atualiza uma transação | Sim |
| PATCH | `/transacoes/:id/pagar` | Paga a transação | Sim |
| PATCH | `/transacoes/:id/cancelar` | Cancela a transação | Sim |
| DELETE | `/transacoes/:id` | Exclui uma transação cancelada | Sim |

Filtros da listagem, todos opcionais:
- `inicio` e `fim`: período, no formato `AAAA-MM-DD`.
- `contaId`.
- `status`: `a`, `p` ou `c`.
- `ordenarPor`: `data` (padrão), `codigo`, `status`, `categoria`, `operacao`, `valor` ou `conta`.
- `ordem`: `desc` (padrão) ou `asc`.

Exemplo: `/transacoes?inicio=2026-11-01&fim=2026-11-30&ordenarPor=valor`

## Estrutura

```
src/
  server.ts       sobe o servidor
  app.ts          configura o Express e registra as rotas
  container.ts    cria os repositories e services
  config/         variáveis de ambiente e Swagger
  database/       conexão SQLite e schema.sql
  routes/         rotas (com a documentação do Swagger)
  controllers/    recebem a requisição e devolvem a resposta
  services/       regras de negócio
  repositories/   acesso ao banco
  schemas/        validação com Zod
  models/         tipos das entidades
  middlewares/    autenticação, validação e tratamento de erros
```
