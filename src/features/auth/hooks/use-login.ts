import { useMutation } from '@tanstack/react-query';
import { login } from '../api/auth.api';

/** Sem invalidação: ao entrar, a navegação completa recomeça o cache do zero. */
export function useLogin() {
  return useMutation({ mutationFn: login });
}
