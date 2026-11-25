import { TransacaoResumo } from "./types";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatarMoeda(valor: number) {
    return moeda.format(valor);
}

export function dataLocal(data = new Date()) {
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${data.getFullYear()}-${mes}-${dia}`;
}

export function formatarData(data: string) {
    return data.slice(0, 10).split("-").reverse().join("/");
}

export function converterData(texto: string) {
    const data = texto.trim();
    return /^\d{2}\/\d{2}\/\d{4}$/.test(data) ? data.split("/").reverse().join("-") : data;
}

export function converterValor(texto: string) {
    const valor = texto.trim().replace(/\s/g, "").replace(/^R\$/, "");
    if (!valor) return null;
    const normalizado = valor.includes(",") ? valor.replace(/\./g, "").replace(",", ".") : valor;
    const numero = Number(normalizado);
    return Number.isFinite(numero) ? numero : null;
}

// Avulsas mostram a categoria; transações de agendamento, a parcela.
export function descreverOrigem(transacao: TransacaoResumo) {
    if (transacao.agendamentoId === null) return transacao.categoriaNome;
    return transacao.totalParcelas !== null
        ? `Parcela ${transacao.numeroOcorrencia}/${transacao.totalParcelas}`
        : `Ocorrência ${transacao.numeroOcorrencia}`;
}
