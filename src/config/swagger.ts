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
            { name: "Usuário", description: "Cadastro do usuário do sistema" }
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
