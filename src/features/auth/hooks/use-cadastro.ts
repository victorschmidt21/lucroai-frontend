import { useMutation } from '@tanstack/react-query';
import { cadastrar } from '../api/auth.api';

/** Sem invalidação: ao entrar, a navegação completa recomeça o cache do zero. */
export function useCadastro() {
  return useMutation({ mutationFn: cadastrar });
}
