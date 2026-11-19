import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../errors/app-error";
import { UsuarioRepository } from "../repositories/usuario-repository";
import { LoginInput } from "../schemas/usuario-schema";

export class AuthService {
    constructor(private readonly repository: UsuarioRepository) {}

    login(dados: LoginInput) {
        const credenciais = this.repository.buscarCredenciaisPorEmail(dados.email);
        if (!credenciais || !bcrypt.compareSync(dados.senha, credenciais.senhaHash)) {
            throw new AppError("Email ou senha inválidos", 401);
        }

        const usuario = {
            id: credenciais.id,
            nome: credenciais.nome,
            email: credenciais.email
        };
        const token = jwt.sign(
            { nome: usuario.nome, email: usuario.email },
            env.JWT_SECRET,
            {
                subject: String(usuario.id),
                expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
            }
        );

        return { token, usuario };
    }
}
