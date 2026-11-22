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
            { name: "Contas", description: "Contas financeiras do usuário autenticado" }
        ],

        components: {
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
