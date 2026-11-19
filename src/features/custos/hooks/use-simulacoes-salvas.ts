'use client';

import { useSyncExternalStore } from 'react';
import {
  parseSimulacoesSalvas,
  type SimulacaoSalva,
} from '../schemas/simulacao-salva.schema';

// No mobile, os registros ficam numa lista estática da tela. Na web, ficam em
// memória e numa cópia no `localStorage` (exceção de docs/security.md), para
// sobreviverem ao recarregamento. Sem `localStorage`, valem só na sessão.
const CHAVE = 'lucroai:calculo-real:simulacoes';
const NENHUMA: SimulacaoSalva[] = [];

let simulacoes: SimulacaoSalva[] | null = null;
const ouvintes = new Set<() => void>();

function lerDoNavegador() {
  try {
    return parseSimulacoesSalvas(window.localStorage.getItem(CHAVE));
  } catch {
    return [];
  }
}

function getSnapshot() {
  simulacoes ??= lerDoNavegador();
  return simulacoes;
}

function subscribe(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

function salvar(simulacao: SimulacaoSalva) {
  simulacoes = [...getSnapshot(), simulacao];

  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(simulacoes));
  } catch {
    // Navegador sem armazenamento: a simulação fica só na memória.
  }

  ouvintes.forEach((ouvinte) => ouvinte());
}

/** Simulações salvas, na ordem em que foram salvas, e a função de salvar. */
export function useSimulacoesSalvas() {
  const lista = useSyncExternalStore(subscribe, getSnapshot, () => NENHUMA);

  return { simulacoes: lista, salvar };
}
