import 'server-only';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { lerSessao } from './jwt';
import {
  CURRENT_PATH_HEADER,
  DEFAULT_PATH,
  getLoginPath,
  SESSION_COOKIE,
} from './session-paths';
import { toUsuarioAtual, type UsuarioAtual } from './usuario-atual';

async function lerCookie() {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

/**
 * Token da sessão em vigor, para o `apiFetch` do servidor (`opcoes.token`) em
 * Server Components. Nunca o passe a um Client Component.
 */
export const getTokenDaSessao = cache(async () => {
  const token = await lerCookie();

  return lerSessao(token) ? token : undefined;
});

/** Usuário da sessão, ou `null` sem sessão em vigor. Não redireciona. */
export const lerUsuarioAtual = cache(async (): Promise<UsuarioAtual | null> => {
  const payload = lerSessao(await lerCookie());

  return payload ? toUsuarioAtual(payload) : null;
});

/**
 * Usuário da sessão, para Server Components (layout de `(app)`, FE-08). Sem
 * sessão em vigor, leva ao login com a rota atual; se havia um cookie (vencido
 * ou ilegível), com o aviso de sessão expirada. Só serve para exibir dados: o
 * acesso é decidido pelo backend, que valida o token a cada chamada.
 */
export const getUsuarioAtual = cache(async (): Promise<UsuarioAtual> => {
  const usuario = await lerUsuarioAtual();

  if (usuario) return usuario;

  const [cookie, headerStore] = await Promise.all([lerCookie(), headers()]);
  const destino = headerStore.get(CURRENT_PATH_HEADER) ?? DEFAULT_PATH;

  redirect(getLoginPath(destino, { expirada: Boolean(cookie) }));
});
