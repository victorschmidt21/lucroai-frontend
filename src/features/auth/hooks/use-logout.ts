import { useMutation, useQueryClient } from '@tanstack/react-query';
import { navigateTo } from '@/shared/auth/navigation';
import { LOGIN_PATH } from '@/shared/auth/session-paths';
import { logout } from '../api/auth.api';

/**
 * Apaga o cookie, limpa o cache do TanStack Query (para os dados não aparecerem
 * ao próximo usuário no mesmo navegador) e leva ao login com navegação completa.
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      navigateTo(LOGIN_PATH);
    },
  });
}
