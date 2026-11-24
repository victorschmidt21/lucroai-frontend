import { isDicaId, type DicaId } from './dicas';

/*
 * Onde a dica na hora certa (FE-68) guarda o que já aconteceu, sempre com
 * `try/catch` (modo privado, bloqueio): sem armazenamento, fica em memória até
 * recarregar a página. Só ids de dica e um horário, nenhum dado de negócio.
 */

/** Dicas já vistas (ação, "Entendi" ou "Não mostrar de novo"): não voltam. */
const CHAVE_VISTAS = 'aprender:dicas-vistas';
/** A dica que já apareceu nesta sessão: outra não aparece. */
const CHAVE_SESSAO = 'aprender:dica-da-sessao';
/** Quando a primeira sessão começou, para a carência de 30 segundos. */
const CHAVE_PRIMEIRO_ACESSO = 'aprender:primeiro-acesso';

const memoria = new Map<string, string>();

function ler(armazenamento: 'localStorage' | 'sessionStorage', chave: string) {
  try {
    return window[armazenamento].getItem(chave) ?? memoria.get(chave) ?? null;
  } catch {
    return memoria.get(chave) ?? null;
  }
}

function gravar(
  armazenamento: 'localStorage' | 'sessionStorage',
  chave: string,
  valor: string,
) {
  memoria.set(chave, valor);
  try {
    window[armazenamento].setItem(chave, valor);
  } catch {
    // Fica só em memória.
  }
}

function lerVistas(): DicaId[] {
  try {
    const lidas: unknown = JSON.parse(
      ler('localStorage', CHAVE_VISTAS) ?? '[]',
    );
    return Array.isArray(lidas) ? lidas.filter(isDicaId) : [];
  } catch {
    return [];
  }
}

export function marcarDicaVista(id: DicaId) {
  const vistas = lerVistas();
  if (!vistas.includes(id)) {
    gravar('localStorage', CHAVE_VISTAS, JSON.stringify([...vistas, id]));
  }
}

export function marcarDicaDaSessao(id: DicaId) {
  gravar('sessionStorage', CHAVE_SESSAO, id);
}

export type ArmazenamentoDasDicas = {
  vistas: DicaId[];
  dicaDaSessao: DicaId | null;
  primeiroAcesso: number;
};

/**
 * O que está guardado ao abrir a tela; `null` no servidor. Na primeira vez,
 * grava agora como o começo da primeira sessão.
 */
export function lerArmazenamentoDasDicas(): ArmazenamentoDasDicas | null {
  if (typeof window === 'undefined') return null;
  const guardado = Number(ler('localStorage', CHAVE_PRIMEIRO_ACESSO));
  let primeiroAcesso = guardado;
  if (!Number.isFinite(guardado) || guardado <= 0) {
    primeiroAcesso = Date.now();
    gravar('localStorage', CHAVE_PRIMEIRO_ACESSO, String(primeiroAcesso));
  }
  const sessao = ler('sessionStorage', CHAVE_SESSAO);
  return {
    vistas: lerVistas(),
    dicaDaSessao: isDicaId(sessao) ? sessao : null,
    primeiroAcesso,
  };
}
