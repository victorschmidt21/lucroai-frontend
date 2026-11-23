import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/components/login-form';
import { loginSearchSchema } from '@/features/auth/schemas/login-search.schema';
import { Card } from '@/shared/ui/card';
import { Logo } from '@/shared/ui/logo';

export const metadata: Metadata = { title: 'Entrar' };

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const { redirect, expirada } = loginSearchSchema.parse(await searchParams);

  return (
    <>
      <header className="flex flex-col items-center gap-3 text-center">
        <h1>
          <Logo />
        </h1>
        <p className="text-body text-ink-muted">Seu doce, seu preço justo.</p>
      </header>
      <Card className="p-5">
        <LoginForm redirectTo={redirect} sessaoExpirada={expirada} />
      </Card>
    </>
  );
}
