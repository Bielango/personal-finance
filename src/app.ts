import express from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { autenticar } from "./middlewares/autenticar";
import { erroHandler } from "./middlewares/error-handler";
import { authRoutes } from "./routes/auth-routes";
import { categoriasRoutes } from "./routes/categorias-routes";
import { contasRoutes } from "./routes/contas-routes";
import { transacoesRoutes } from "./routes/transacoes-routes";
import { usuariosRoutes } from "./routes/usuarios-routes";

const app = express();

app.use(express.json());

// Libera o acesso de outros endereços (front-end, app mobile).
app.use((request, response, next) => {
    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");

    if (request.method === "OPTIONS") {
        response.sendStatus(204);
        return;
    }
    next();
});

app.get("/", (_request, response) => {
    return response.status(200).json({
        nome: "Personal Finance API",
        versao: "1.0.0",
        documentacao: "/docs"
    });
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas públicas
app.use("/auth", authRoutes);

// Rotas protegidas
app.use("/usuarios", autenticar, usuariosRoutes);
app.use("/contas", autenticar, contasRoutes);
app.use("/categorias", autenticar, categoriasRoutes);
app.use("/transacoes", autenticar, transacoesRoutes);

app.use((_request, response) => {
    response.status(404).json({ mensagem: "Rota não encontrada" });
});

app.use(erroHandler);

export { app };
