import bcrypt from "bcryptjs";
import { db } from "../database/db";
import { Usuario, UsuarioCredenciais } from "../models/usuario";
import { UsuarioInput } from "../schemas/usuario-schema";
import { UsuarioRepository } from "./usuario-repository";

// Quanto maior o custo, mais lento (e mais difícil de adivinhar) fica o hash.
const CUSTO_HASH = 10;

function mapearUsuario(registro: Record<string, unknown>): Usuario {
    return {
        id: Number(registro.id),
        nome: String(registro.nome),
        email: String(registro.email)
    };
}

// A coluna USU_SENHA fica de fora de propósito: a senha nunca sai do banco.
const SELECT_USUARIO = `
    SELECT USU_ID    AS id,
           USU_NOME  AS nome,
           USU_EMAIL AS email
    FROM USUARIO`;

export class UsuarioRepositorySqlite implements UsuarioRepository {

    contar(): number {
        const resultado = db.prepare("SELECT COUNT(*) AS total FROM USUARIO").get();
        return Number(resultado?.total ?? 0);
    }

    buscarPorId(id: number): Usuario | null {
        const usuario = db.prepare(`${SELECT_USUARIO} WHERE USU_ID = ?`).get(id);
        return usuario ? mapearUsuario(usuario) : null;
    }

    buscarCredenciaisPorEmail(email: string): UsuarioCredenciais | null {
        const registro = db.prepare(`
            SELECT USU_ID    AS id,
                   USU_NOME  AS nome,
                   USU_EMAIL AS email,
                   USU_SENHA AS senhaHash
            FROM USUARIO
            WHERE USU_EMAIL = ?
        `).get(email);

        if (!registro) return null;
        return {
            ...mapearUsuario(registro),
            senhaHash: String(registro.senhaHash)
        };
    }

    criar(dados: UsuarioInput): Usuario {
        const resultado = db.prepare(`
            INSERT INTO USUARIO (USU_NOME, USU_EMAIL, USU_SENHA)
            VALUES (?, ?, ?)
        `).run(dados.nome, dados.email, bcrypt.hashSync(dados.senha, CUSTO_HASH));

        const usuario = this.buscarPorId(Number(resultado.lastInsertRowid));
        if (!usuario) throw new Error("Erro ao criar usuário");
        return usuario;
    }
}
