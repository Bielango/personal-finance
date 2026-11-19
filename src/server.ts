import { env } from "./config/env";
import "./database/db"; // abre o banco e cria as tabelas ao iniciar
import { app } from "./app";

app.listen(env.PORT, () => {
    console.log(`Servidor rodando em http://localhost:${env.PORT}`);
    console.log(`Swagger em http://localhost:${env.PORT}/docs`);
});
