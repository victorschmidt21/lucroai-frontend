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
      // Navega antes de limpar: a busca da sessão que o `clear()` provoca
      // recebe 401, e `handleSessaoExpirada` a ignora com a navegação em curso.
      navigateTo(LOGIN_PATH);
      queryClient.clear();
    },
  });
}
