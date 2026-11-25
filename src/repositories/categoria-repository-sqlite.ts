import { db } from "../database/db";
import { Categoria } from "../models/categoria";
import { CategoriaRepository } from "./categoria-repository";

function mapearCategoria(registro: Record<string, unknown>): Categoria {
    return {
        id: Number(registro.id),
        nome: String(registro.nome),
        permiteRepetir: Boolean(registro.permiteRepetir)
    };
}

const SELECT_CATEGORIA = `
    SELECT CAT_ID      AS id,
           CAT_NOME    AS nome,
           CAT_REPETIR AS permiteRepetir
    FROM CATEGORIA`;

export class CategoriaRepositorySqlite implements CategoriaRepository {
    listar(): Categoria[] {
        return db.prepare(`${SELECT_CATEGORIA} ORDER BY CAT_ID`).all().map(mapearCategoria);
    }

    buscarPorId(id: number): Categoria | null {
        const categoria = db.prepare(`${SELECT_CATEGORIA} WHERE CAT_ID = ?`).get(id);
        return categoria ? mapearCategoria(categoria) : null;
    }
}
