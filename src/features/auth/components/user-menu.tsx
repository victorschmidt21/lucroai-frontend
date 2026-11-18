'use client';

import { getErrorMessage } from '@/shared/api/errors';
import { useUsuarioAtual } from '@/shared/auth/use-usuario-atual';
import { Button } from '@/shared/ui/button';
import { IconSair } from '@/shared/ui/icons/acoes';
import { Skeleton } from '@/shared/ui/skeleton';
import { useLogout } from '../hooks/use-logout';

/**
 * Menu do usuário: nome, e-mail, nome da empresa (do payload do JWT, via
 * `GET /api/auth/sessao`) e "Sair". Fica no rodapé do menu lateral do layout de
 * `(app)` (FE-08). Sem sessão, a query recebe 401 e o `QueryClient` leva ao login.
 */
export function UserMenu() {
  const { data: usuario, isPending } = useUsuarioAtual();
  const logout = useLogout();

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {isPending ? (
        <Skeleton aria-label="Carregando usuário" className="h-14" />
      ) : usuario ? (
        <div className="flex min-w-0 flex-col text-body">
          {/* `nome` pode vir nulo no token: o e-mail identifica a conta. */}
          <span className="truncate font-bold">
            {usuario.nome ?? usuario.email}
          </span>
          <span className="truncate text-small text-ink-muted">
            {usuario.email}
          </span>
          <span className="truncate text-small text-ink-muted">
            {usuario.empresa.nome}
          </span>
        </div>
      ) : null}
      {logout.error ? (
        <p role="alert" className="text-small text-danger">
          {getErrorMessage(logout.error)}
        </p>
      ) : null}
      <Button
        variant="secundario"
        size="compacto"
        loading={logout.isPending}
        disabled={logout.isSuccess}
        onClick={() => logout.mutate()}
        className="self-start"
      >
        <IconSair className="size-4" />
        Sair
      </Button>
    </div>
  );
}
