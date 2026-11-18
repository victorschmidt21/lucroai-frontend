import type { ApiError } from '@/shared/api/errors';
import { isNavegando, navigateTo } from './navigation';
import { getLoginPath, LOGIN_PATH } from './session-paths';

/**
 * O `onSessaoExpirada` do `QueryClient` (FE-05): um 401 de qualquer serviço leva
 * a `/login?redirect=<rota atual>&expirada=1`. O proxy BFF já apagou o cookie.
 * No próprio login, um 401 é senha errada, e quem trata é o formulário; com
 * uma navegação em curso (ao sair, ou depois de outro 401), não faz nada.
 */
export function handleSessaoExpirada(_error?: ApiError) {
  if (typeof window === 'undefined' || isNavegando()) return;

  const { pathname, search } = window.location;

  if (pathname === LOGIN_PATH) return;

  navigateTo(getLoginPath(`${pathname}${search}`, { expirada: true }));
}
