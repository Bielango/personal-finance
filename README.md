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
