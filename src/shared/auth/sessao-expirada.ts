import type { ApiError } from '@/shared/api/errors';
import { navigateTo } from './navigation';
import { getLoginPath, LOGIN_PATH } from './session-paths';

/**
 * O `onSessaoExpirada` do `QueryClient` (FE-05): um 401 de qualquer serviço leva
 * a `/login?redirect=<rota atual>&expirada=1`. O proxy BFF já apagou o cookie.
 * No próprio login, um 401 é senha errada, e quem trata é o formulário.
 */
export function handleSessaoExpirada(_error?: ApiError) {
  if (typeof window === 'undefined') return;

  const { pathname, search } = window.location;

  if (pathname === LOGIN_PATH) return;

  navigateTo(getLoginPath(`${pathname}${search}`, { expirada: true }));
}
