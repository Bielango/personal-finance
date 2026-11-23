# Guia do projeto

Como o código está organizado e o que seguir ao mexer nele. As rotas e o passo a passo para rodar a API estão no [README](README.md).

## Visão geral

```
src/            API (Express + SQLite)
mobile/         app (Expo / React Native) que consome a API
.env.example    variáveis da API
```

A API e o app conversam por HTTP. O app faz login em `/auth/login`, guarda o token e o envia no header `Authorization: Bearer <token>` em todas as outras chamadas.

## Rodando

**API** (na raiz do repositório):

```bash
npm install
cp .env.example .env   # troque o JWT_SECRET
npm run dev            # http://localhost:3000 e Swagger em /docs
```

**App** (em outro terminal):

```bash
cd mobile
npm install
cp .env.example .env   # ajuste o EXPO_PUBLIC_API_URL
npm run web            # ou: npm run android
```

| Onde o app roda | `EXPO_PUBLIC_API_URL` |
|---|---|
| Navegador (`npm run web`) | `http://localhost:3000` |
| Emulador Android | `http://10.0.2.2:3000` |
| Celular físico | `http://<IPv4 do computador>:3000`, na mesma rede Wi-Fi |

Para testar sem mexer nos seus dados, troque o `DATABASE_FILE` no `.env` por outro nome (ex.: `teste.db`). O arquivo é criado sozinho e pode ser apagado depois.

## Caminho de uma requisição

```
app.ts          registra a rota; "autenticar" confere o token nas rotas protegidas (401)
  routes/       define a rota, a documentação do Swagger e o "validar"
  validar       confere body, params ou query com o schema do Zod (400)
  controllers/  pega os dados da requisição e escolhe o status da resposta
  services/     regras de negócio; lança AppError quando algo não pode
  repositories/ SQL puro
  database/     conexão e schema.sql
```

- Depois do `validar`, `request.body`, `request.params` e `request.query` já chegam convertidos pelo Zod (ex.: o `id` vira número) e sem campos extras.
- O controller nunca acessa o banco, e o repository nunca decide regra de negócio.
- O `container.ts` cria os repositories e entrega para os services. Um service que precisa de outra tabela recebe o repository dela, como o `ContaService` recebe o `UsuarioRepository`.

## Criando um módulo novo

Use o módulo de **Contas** como modelo. Os arquivos ficam em kebab-case: no singular para model, schema, repository e service (`conta-service.ts`) e no plural para routes e controller (`contas-routes.ts`).

1. `src/database/schema.sql`: a tabela.
2. `src/models/`: a interface com os campos que a API devolve.
3. `src/schemas/`: os schemas do Zod (entrada e id) e o tipo com `z.infer`.
4. `src/repositories/`: a interface (`x-repository.ts`) e a implementação (`x-repository-sqlite.ts`).
5. `src/services/`: as regras, com `AppError`.
6. `src/controllers/`: uma função por rota.
7. `src/routes/`: as rotas com o `validar` e o comentário `@openapi`.
8. `src/container.ts`: cria o repository e o service.
9. `src/app.ts`: `app.use("/rota", autenticar, xRoutes)`.
10. `src/config/swagger.ts`: a tag e os schemas (`X` e `XInput`).
11. `README.md`: a tabela de rotas.
12. No app: os tipos em `mobile/src/types.ts`, as chamadas em `mobile/src/services/api.ts`, a tela em `mobile/src/screens/` e a aba em `mobile/App.tsx`.

Os métodos seguem os mesmos nomes em todas as camadas: `listar`, `buscarPorId`, `criar`, `atualizar` e `excluir`.

## Convenções

### Banco

- Nome da tabela no singular e em maiúsculas (`CONTA`), com colunas prefixadas por 3 letras da tabela (`CON_NOME`).
- Chave estrangeira: prefixo da tabela + prefixo da tabela referenciada + `_ID` (`CON_USU_ID`).
- Constraints com nome: `FK_`, `UQ_` e `CK_` seguidos do prefixo (`FK_CON_USUARIO`, `CK_CON_TIPO`).
- Sempre `CREATE TABLE IF NOT EXISTS`. Ele **não altera** uma tabela que já existe: se mudar colunas, apague o `.db` local e rode de novo.
- Use `?` nos parâmetros, nunca concatene valores no SQL.
- O SELECT usa `AS` para devolver os nomes em camelCase, e uma função `mapearX` monta o objeto. A senha nunca entra no SELECT de listagem.

### Dinheiro

- Fica em **centavos** (`INTEGER`) no banco e em **reais** (número com até 2 casas) na API.
- Converta ao gravar com `Math.round(valor * 100)` e ao ler com `/ 100`, sempre no repository.
- No Zod, use `.multipleOf(0.01)` para limitar a 2 casas.

### Erros e respostas

| Status | Quando | Quem gera |
|---|---|---|
| 200 / 201 / 204 | ok / criado / excluído | controller |
| 400 | dados inválidos ou JSON quebrado | `validar` e `erroHandler` |
| 401 | sem token ou token inválido | `autenticar` |
| 403 | ação bloqueada pela regra | service (`AppError`) |
| 404 | registro não encontrado | service (`AppError`) |
| 409 | conflito: duplicado ou em uso | service (`AppError`) |
| 500 | erro inesperado (aparece no terminal) | `erroHandler` |

O corpo de erro é sempre `{ "mensagem": "..." }`. O erro de validação também traz `"erros": [{ "campo", "mensagem" }]`, que o app já mostra na tela.

### Swagger

- A tag usada na rota (`tags: [Contas]`) tem que ser **igual** à declarada em `swagger.ts`, com acento e tudo, senão o Swagger cria um grupo separado.
- Rotas públicas levam `security: []`; as outras exigem o token.

## Git

- Antes de começar: `git pull` na `main`.
- Trabalhe numa branch própria (`git switch -c nome-da-tarefa`) e abra um pull request para a `main`.
- Antes do PR, rode `npm run typecheck` na raiz (e em `mobile/`, se mexeu no app).
- Nunca suba `.env`, `*.db` ou `node_modules/`; o `.gitignore` já cuida disso.
