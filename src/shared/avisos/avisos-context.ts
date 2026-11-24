'use client';

import { createContext, useContext } from 'react';
import type { Alertas } from '@/shared/api/contracts/catalog';

/**
 * Estado do aviso ao entrar (FE-47), dado pelo `AvisosProvider` de
 * `features/alertas`. Fica em `shared/` para o indicador do topo e a dica na
 * hora certa (FE-68, de `features/aprender`) lerem o mesmo estado sem uma
 * funcionalidade importar a outra.
 */
export type Avisos = {
  total: number;
  abrir: () => void;
  /** `GET /alertas` já em cache; `null` enquanto carrega. */
  alertas: Alertas | null;
  /**
   * O aviso ao entrar já foi resolvido (fechado ou nem precisou abrir) e não
   * abriu sozinho nesta sessão: as dicas de alerta podem aparecer.
   */
  dicasDeAlertaLiberadas: boolean;
};

export const AvisosContext = createContext<Avisos>({
  total: 0,
  abrir: () => {},
  alertas: null,
  dicasDeAlertaLiberadas: false,
});

export function useAvisos() {
  return useContext(AvisosContext);
}
