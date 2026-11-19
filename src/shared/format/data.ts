import { SEM_VALOR } from './texto';

const DATA_SEM_HORA = /^(\d{4})-(\d{2})-(\d{2})$/;

const data = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/**
 * Lê `YYYY-MM-DD` como meia-noite **local**. `new Date('2026-11-01')` seria
 * meia-noite UTC, que no Brasil ainda é 31/10. Data inexistente (`2026-02-30`)
 * ou fora do formato devolve `null`.
 */
export function parseDataSemHora(texto: string | null | undefined) {
  const partes = texto ? DATA_SEM_HORA.exec(texto) : null;

  if (!partes) return null;

  const [ano, mes, dia] = partes.slice(1).map(Number);
  const resultado = new Date(ano, mes - 1, dia);

  const isMesmaData =
    resultado.getFullYear() === ano &&
    resultado.getMonth() === mes - 1 &&
    resultado.getDate() === dia;

  return isMesmaData ? resultado : null;
}

/** Data local em `YYYY-MM-DD`, para a URL e os filtros (inverso de `parseDataSemHora`). */
export function toDataSemHora(valor: Date) {
  const ano = String(valor.getFullYear()).padStart(4, '0');
  const mes = String(valor.getMonth() + 1).padStart(2, '0');
  const dia = String(valor.getDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

/**
 * `dd/mm/aaaa` no fuso local. Aceita a data ISO da API (UTC, convertida para o
 * fuso local), `YYYY-MM-DD` (lido sem deslocar o dia) ou um `Date`.
 */
export function formatData(valor: string | Date | null | undefined) {
  if (valor === null || valor === undefined) return SEM_VALOR;

  const dataLida =
    typeof valor === 'string'
      ? DATA_SEM_HORA.test(valor)
        ? parseDataSemHora(valor)
        : new Date(valor)
      : valor;

  if (!dataLida || Number.isNaN(dataLida.getTime())) return SEM_VALOR;

  return data.format(dataLida);
}

/** 00:00:00.000 local do dia. Envie à API com `toISOString()` (lacuna 7). */
export function inicioDoDia(valor: Date) {
  return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
}

/** 23:59:59.999 local do dia. Envie à API com `toISOString()` (lacuna 7). */
export function fimDoDia(valor: Date) {
  return new Date(
    valor.getFullYear(),
    valor.getMonth(),
    valor.getDate(),
    23,
    59,
    59,
    999,
  );
}
