import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env";

const swaggerOptions: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Personal Finance API",
            version: "1.0.0",
            description: "API de gestão financeira pessoal"
        },

        servers: [
            {
                url: `http://localhost:${env.PORT}`,
                description: "Ambiente de desenvolvimento"
            }
        ],

        // Todas as rotas exigem o token, exceto as marcadas com "security: []".
        security: [{ bearerAuth: [] }],

        tags: [
            { name: "Autenticação", description: "Login e identificação do usuário autenticado" },
            { name: "Usuarios", description: "Cadastro e manutencao dos usuarios" },
            { name: "Contas", description: "Contas financeiras do usuário autenticado" },
            { name: "Categorias", description: "Categorias das transações" },
            { name: "Transações", description: "Recebimentos (+) e gastos (-) das contas" },
            { name: "Agendamentos", description: "Parcelamentos e lançamentos recorrentes" }
        ],

        components: {
            requestBodies: {
                CategoriaInput: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/CategoriaInput" } } }
                }
            },
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            },
            schemas: {
                Usuario: {
                    type: "object",
                    properties: {
                        id: { type: "integer", example: 1 },
                        nome: { type: "string", example: "Ana Souza" },
                        email: { type: "string", format: "email", example: "ana@exemplo.com" }
                    }
                },
                UsuarioInput: {
                    type: "object",
                    required: ["nome", "email", "senha"],
                    properties: {
                        nome: { type: "string", example: "Ana Souza" },
                        email: { type: "string", format: "email", example: "ana@exemplo.com" },
                        senha: { type: "string", format: "password", example: "senha123" }
                    }
                },
                UsuarioAtualizacaoInput: {
                    type: "object",
                    required: ["nome", "email"],
                    properties: {
                        nome: { type: "string", example: "Ana Souza" },
                        email: { type: "string", format: "email", example: "ana@exemplo.com" },
                        senha: {
                            type: "string",
                            format: "password",
                            description: "Opcional. Se omitida, mantem a senha atual.",
                            example: "novaSenha123"
                        }
                    }
                },
                LoginInput: {
                    type: "object",
                    required: ["email", "senha"],
                    properties: {
                        email: { type: "string", format: "email", example: "ana@exemplo.com" },
                        senha: { type: "string", format: "password", example: "senha123" }
                    }
                },
                LoginResposta: {
                    type: "object",
                    properties: {
                        token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                        usuario: { $ref: "#/components/schemas/Usuario" }
                    }
                },
                Conta: {
                    type: "object",
                    properties: {
                        id: { type: "integer", example: 1 },
                        nome: { type: "string", example: "Conta principal" },
                        instituicao: { type: "string", nullable: true, example: "Nubank" },
                        tipo: {
                            type: "string",
                            enum: ["corrente", "poupanca", "investimento", "carteira"],
                            example: "corrente"
                        },
                        saldo: { type: "number", format: "double", example: 1500.50 },
                        usuarioId: { type: "integer", example: 1 },
                        usuarioNome: { type: "string", example: "Ana Souza" }
                    }
                },
                ContaInput: {
                    type: "object",
                    required: ["usuarioId", "nome", "tipo", "saldo"],
                    properties: {
                        usuarioId: { type: "integer", example: 1 },
                        nome: { type: "string", example: "Conta principal" },
                        instituicao: { type: "string", example: "Nubank" },
                        tipo: {
                            type: "string",
                            enum: ["corrente", "poupanca", "investimento", "carteira"],
                            example: "corrente"
                        },
                        saldo: { type: "number", format: "double", example: 1500.50 }
                    }
                },
                Categoria: {
                    type: "object",
                    properties: {
                        id: { type: "integer", example: 1 },
                        nome: { type: "string", example: "Alimentação" }
                    }
                },
                CategoriaInput: {
                    type: "object",
                    required: ["nome"],
                    properties: { nome: { type: "string", minLength: 2, maxLength: 100, example: "Moradia" } }
                },
                TransacaoResumo: {
                    type: "object",
                    properties: {
                        id: { type: "integer", example: 1 },
                        titulo: { type: "string", example: "Mercado" },
                        operacao: { type: "string", enum: ["+", "-"], description: "+ = recebimento, - = gasto", example: "-" },
                        valor: { type: "number", format: "double", example: 152.9 },
                        status: { type: "string", enum: ["a", "p", "c"], description: "a = ativa, p = paga, c = cancelada", example: "a" },
                        dataInicio: { type: "string", example: "2026-11-23 14:05:00" },
                        dataFim: { type: "string", nullable: true, description: "Último pagamento ou cancelamento", example: null },
                        contaId: { type: "integer", example: 1 },
                        contaNome: { type: "string", example: "Conta principal" },
                        categoriaId: { type: "integer", example: 1 },
                        categoriaNome: { type: "string", example: "Alimentação" },
                        agendamentoId: { type: "integer", nullable: true },
                        numeroOcorrencia: { type: "integer", nullable: true }
                    }
                },
                Transacao: {
                    allOf: [
                        { $ref: "#/components/schemas/TransacaoResumo" },
                        {
                            type: "object",
                            properties: {
                                descricao: { type: "string", nullable: true, example: "Compra do mês" }
                            }
                        }
                    ]
                },
                TransacaoInput: {
                    type: "object",
                    required: ["contaId", "categoriaId", "titulo", "operacao", "valor"],
                    properties: {
                        contaId: { type: "integer", example: 1 },
                        categoriaId: { type: "integer", example: 1 },
                        titulo: { type: "string", example: "Mercado" },
                        descricao: { type: "string", example: "Compra do mês" },
                        operacao: { type: "string", enum: ["+", "-"], example: "-" },
                        valor: { type: "number", format: "double", description: "Sempre positivo; o sinal vem da operação", example: 152.9 }
                    }
                },
                AgendamentoInput: {
                    allOf: [
                        { $ref: "#/components/schemas/TransacaoInput" },
                        {
                            type: "object",
                            required: ["primeiroVencimento"],
                            properties: { primeiroVencimento: { type: "string", format: "date", example: "2026-12-31" } },
                            oneOf: [
                                {
                                    required: ["tipo", "parcelas"],
                                    properties: {
                                        tipo: { type: "string", enum: ["parcelado"] },
                                        parcelas: { type: "integer", minimum: 2, maximum: 120 }
                                    }
                                },
                                {
                                    required: ["tipo", "periodicidade"],
                                    properties: {
                                        tipo: { type: "string", enum: ["recorrente"] },
                                        periodicidade: { type: "string", enum: ["semanal", "mensal", "anual"] },
                                        ate: { type: "string", format: "date" }
                                    }
                                }
                            ]
                        }
                    ],
                    description: "Em parcelamentos, valor é o total. Em recorrências, é o valor de cada lançamento.",
                    example: {
                        contaId: 1, categoriaId: 2, titulo: "Mesa", operacao: "-", valor: 300,
                        primeiroVencimento: "2026-12-31", tipo: "parcelado", parcelas: 3
                    }
                },
                Agendamento: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        contaId: { type: "integer" },
                        contaNome: { type: "string" },
                        categoriaId: { type: "integer" },
                        categoriaNome: { type: "string" },
                        titulo: { type: "string" },
                        descricao: { type: "string", nullable: true },
                        operacao: { type: "string", enum: ["+", "-"] },
                        valor: { type: "number" },
                        tipo: { type: "string", enum: ["parcelado", "recorrente"] },
                        primeiroVencimento: { type: "string", format: "date" },
                        parcelas: { type: "integer", nullable: true },
                        periodicidade: { type: "string", enum: ["semanal", "mensal", "anual"], nullable: true },
                        ate: { type: "string", format: "date", nullable: true },
                        status: { type: "string", enum: ["ativo", "concluido", "cancelado"] },
                        proximoVencimento: { type: "string", format: "date", nullable: true },
                        pendentes: { type: "integer" },
                        pagas: { type: "integer" }
                    }
                },
                AgendamentoDetalhe: {
                    allOf: [
                        { $ref: "#/components/schemas/Agendamento" },
                        {
                            type: "object",
                            properties: {
                                ocorrencias: { type: "array", items: { $ref: "#/components/schemas/TransacaoResumo" } }
                            }
                        }
                    ]
                },
                MensagemErro: {
                    type: "object",
                    properties: {
                        mensagem: { type: "string", example: "Token inválido ou expirado" }
                    }
                },
                ErroValidacao: {
                    type: "object",
                    properties: {
                        mensagem: { type: "string", example: "Dados inválidos" },
                        erros: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    campo: { type: "string", example: "email" },
                                    mensagem: { type: "string", example: "Informe um email válido" }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    apis: [
        "./src/routes/*.ts",
        "./dist/routes/*.js"
    ]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export { swaggerSpec };
