import bcrypt from "bcryptjs";
import { db } from "../database/db";
import { Usuario, UsuarioCredenciais } from "../models/usuario";
import { UsuarioAtualizacaoInput, UsuarioInput } from "../schemas/usuario-schema";
import { UsuarioRepository } from "./usuario-repository";

const CUSTO_HASH = 10;

function mapearUsuario(registro: Record<string, unknown>): Usuario {
    return {
        id: Number(registro.id),
        nome: String(registro.nome),
        email: String(registro.email)
    };
}

// A senha fica fora do SELECT para nunca sair nas respostas da API.
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

    listar(): Usuario[] {
        return db.prepare(`${SELECT_USUARIO} ORDER BY USU_NOME`).all().map(mapearUsuario);
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

    emailEmUso(email: string, ignorarId = 0): boolean {
        return db.prepare(`
            SELECT 1
            FROM USUARIO
            WHERE USU_EMAIL = ? AND USU_ID <> ?
        `).get(email, ignorarId) !== undefined;
    }

    criar(dados: UsuarioInput): Usuario {
        const resultado = db.prepare(`
            INSERT INTO USUARIO (USU_NOME, USU_EMAIL, USU_SENHA)
            VALUES (?, ?, ?)
        `).run(dados.nome, dados.email, bcrypt.hashSync(dados.senha, CUSTO_HASH));

        const usuario = this.buscarPorId(Number(resultado.lastInsertRowid));
        if (!usuario) throw new Error("Erro ao criar usuario");
        return usuario;
    }

    atualizar(id: number, dados: UsuarioAtualizacaoInput): Usuario | null {
        const resultado = dados.senha
            ? db.prepare(`
                UPDATE USUARIO
                SET USU_NOME = ?, USU_EMAIL = ?, USU_SENHA = ?
                WHERE USU_ID = ?
            `).run(
                dados.nome,
                dados.email,
                bcrypt.hashSync(dados.senha, CUSTO_HASH),
                id
            )
            : db.prepare(`
                UPDATE USUARIO
                SET USU_NOME = ?, USU_EMAIL = ?
                WHERE USU_ID = ?
            `).run(dados.nome, dados.email, id);

        if (resultado.changes === 0) return null;
        return this.buscarPorId(id);
    }

    excluir(id: number): boolean {
        return db.prepare("DELETE FROM USUARIO WHERE USU_ID = ?").run(id).changes > 0;
    }
}
