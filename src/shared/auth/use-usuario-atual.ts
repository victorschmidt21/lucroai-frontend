'use client';

import { useQuery } from '@tanstack/react-query';
import { usuarioAtualOptions } from './usuario-atual.queries';

/** Usuário da sessão, para Client Components. No servidor, use `getUsuarioAtual()`. */
export function useUsuarioAtual() {
  return useQuery(usuarioAtualOptions());
}
