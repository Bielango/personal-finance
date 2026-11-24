import { atomico, db } from "../database/db";
import { Categoria } from "../models/categoria";
import { CategoriaRepository } from "./categoria-repository";

function mapearCategoria(registro: Record<string, unknown>): Categoria {
    return {
        id: Number(registro.id),
        nome: String(registro.nome)
    };
}

const SELECT_CATEGORIA = `
    SELECT CAT_ID   AS id,
           CAT_NOME AS nome
    FROM CATEGORIA`;

export class CategoriaRepositorySqlite implements CategoriaRepository {
    atomico = atomico;

    listar(): Categoria[] {
        return db.prepare(`${SELECT_CATEGORIA} ORDER BY CAT_NOME`).all().map(mapearCategoria);
    }

    buscarPorId(id: number): Categoria | null {
        const categoria = db.prepare(`${SELECT_CATEGORIA} WHERE CAT_ID = ?`).get(id);
        return categoria ? mapearCategoria(categoria) : null;
    }

    criar(nome: string): Categoria {
        const registro = db.prepare("INSERT INTO CATEGORIA (CAT_NOME) VALUES (?) RETURNING CAT_ID AS id, CAT_NOME AS nome")
            .get(nome);
        if (!registro) throw new Error("Erro ao criar categoria");
        return mapearCategoria(registro);
    }

    atualizar(id: number, nome: string): Categoria {
        const registro = db.prepare("UPDATE CATEGORIA SET CAT_NOME = ? WHERE CAT_ID = ? RETURNING CAT_ID AS id, CAT_NOME AS nome")
            .get(nome, id);
        if (!registro) throw new Error("Erro ao atualizar categoria");
        return mapearCategoria(registro);
    }

    excluir(id: number) {
        db.prepare("DELETE FROM CATEGORIA WHERE CAT_ID = ?").run(id);
    }

    emUso(id: number) {
        return !!db.prepare(`
            SELECT 1 FROM TRANSACAO WHERE TRA_CAT_ID = ?
            UNION ALL
            SELECT 1 FROM AGENDAMENTO WHERE AGE_CAT_ID = ?
            LIMIT 1
        `).get(id, id);
    }
}
