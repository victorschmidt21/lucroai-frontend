import { UserMenu } from '@/features/auth/components/user-menu';
import { QueryProvider } from '@/shared/api/query-provider';
import { getUsuarioAtual } from '@/shared/auth/usuario-atual.server';
import { Card } from '@/shared/ui/card';

/**
 * Página inicial provisória, substituída pelo painel em `(app)` na FE-08 e na
 * FE-22. Até lá, é a única tela com sessão: confere o usuário no servidor e
 * mostra o menu do usuário, que a FE-08 leva para o layout.
 */
export default async function HomePage() {
  await getUsuarioAtual();

  return (
    <QueryProvider>
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-heading">LucroAI</h1>
          <p className="text-subtitle text-ink-muted">
            Página provisória. O sistema está em construção.
          </p>
        </div>
        <Card className="w-full max-w-sm text-left">
          <UserMenu />
        </Card>
      </main>
    </QueryProvider>
  );
}
