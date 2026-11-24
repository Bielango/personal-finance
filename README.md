# Personal Finance

Organizador de finanças pessoais com painel em Expo e API em TypeScript. O painel reúne contas, categorias, transações e agendamentos.

Para trabalhar no código (organização, convenções e como criar um módulo novo), veja o [Guia do projeto](GUIA.md).

## Tecnologias

- Node.js 22.5+ e TypeScript
- Express 5
- SQLite (`node:sqlite`, nativo do Node)
- Zod (validação)
- JWT + bcrypt (autenticação)
- Swagger (documentação)
- Expo e React Native (interface web e mobile)

## Como rodar

```bash
npm install
cp .env.example .env   # depois troque o JWT_SECRET
npm run dev
```

- API: `http://localhost:3000`
- Documentação (Swagger): `http://localhost:3000/docs`

O banco (`personal-finance.db`) é criado automaticamente na primeira execução.

Em outro terminal, abra a interface:

```bash
cd mobile
npm install
npm run web
```

O app web usa `http://localhost:3000` como endereço padrão da API. Se for preciso mudar o endereço, copie `mobile/.env.example` e ajuste `EXPO_PUBLIC_API_URL`. Para Android, consulte o [Guia do projeto](GUIA.md).

Na interface, use **Criar primeiro acesso**, cadastre uma conta e abra **Agendamentos**. Cada vencimento abre a transação correspondente para confirmar o pagamento ou recebimento. A **Visão geral** reúne os saldos, os vencimentos pendentes e a previsão de receitas e despesas agendadas para os próximos 30 dias.

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

Transações e agendamentos bloqueiam a exclusão da conta vinculada e do seu usuário.

## Categorias

| Método | Rota | Descrição | Token |
|---|---|---|---|
| GET | `/categorias` | Lista as categorias | Sim |
| GET | `/categorias/:id` | Busca uma categoria | Sim |
| POST | `/categorias` | Cria uma categoria com `{ "nome": "Educação" }` | Sim |
| PUT | `/categorias/:id` | Renomeia uma categoria | Sim |
| DELETE | `/categorias/:id` | Exclui uma categoria sem vínculos | Sim |

Categorias agrupam receitas e despesas por assunto. Um banco novo começa com Alimentação, Moradia, Transporte, Saúde, Lazer e Salário. Bancos existentes mantêm suas categorias e vínculos. O tipo e a frequência ficam no agendamento.

## Transações

Cada transação é um recebimento (`+`) ou um gasto (`-`) de uma conta. O valor é sempre positivo, e a operação define se ele entra ou sai da conta.

Para transações avulsas:

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

As transações geradas por um agendamento incluem `agendamentoId` e `numeroOcorrencia`. Nesse caso, `dataInicio` é a data de vencimento. Cada ocorrência aceita uma confirmação de pagamento ou recebimento. Edite, cancele ou exclua a série pela rota de agendamentos.

## Agendamentos

Cada agendamento tem conta, categoria, título, valor, operação (`+` ou `-`) e primeiro vencimento. A criação gera transações pendentes, e a confirmação de cada uma movimenta o saldo da conta.

- **Parcelado** gera de 2 a 120 parcelas mensais. Informe o valor total. Quando há diferença de centavos, as primeiras parcelas recebem o centavo adicional até que a soma feche.
- **Recorrente** repete o valor informado semanal, mensal ou anualmente. O fim é opcional e inclusivo. Ao consultar agendamentos ou a lista de transações, a API gera os vencimentos em atraso e até 45 dias à frente, com pelo menos um vencimento futuro enquanto a série tiver novas datas.
- Para meses com menos dias, o vencimento cai no último dia do mês. O dia original volta nos meses em que existe.
- A edição está disponível enquanto a série estiver ativa e sem confirmações. O cancelamento encerra a geração e cancela as pendências, preservando os pagamentos e recebimentos já confirmados. Séries canceladas sem confirmações podem ser excluídas.

| Método | Rota | Descrição | Token |
|---|---|---|---|
| GET | `/agendamentos` | Lista séries e próximos vencimentos | Sim |
| GET | `/agendamentos/:id` | Busca a série com suas ocorrências | Sim |
| POST | `/agendamentos` | Cria uma série | Sim |
| PUT | `/agendamentos/:id` | Atualiza uma série ativa sem pagamentos | Sim |
| PATCH | `/agendamentos/:id/cancelar` | Cancela a série e os vencimentos pendentes | Sim |
| DELETE | `/agendamentos/:id` | Exclui uma série cancelada sem pagamentos | Sim |

Exemplo de parcelamento:

```json
{
  "contaId": 1,
  "categoriaId": 2,
  "titulo": "Mesa",
  "operacao": "-",
  "valor": 300,
  "primeiroVencimento": "2026-12-31",
  "tipo": "parcelado",
  "parcelas": 3
}
```

Para recorrências, use `"tipo": "recorrente"`, informe `periodicidade` como `semanal`, `mensal` ou `anual` e, se houver fim, inclua `ate` no formato `AAAA-MM-DD`.

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
