import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/components/login-form';
import { loginSearchSchema } from '@/features/auth/schemas/login-search.schema';
import { Card } from '@/shared/ui/card';

export const metadata: Metadata = { title: 'Entrar' };

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const { redirect, expirada } = loginSearchSchema.parse(await searchParams);

  return (
    <>
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-display-lg text-ink">LucroAI</h1>
        <p className="text-body text-ink-muted">
          Entre para acessar os dados da sua empresa
        </p>
      </header>
      <Card className="p-5">
        <LoginForm redirectTo={redirect} sessaoExpirada={expirada} />
      </Card>
    </>
  );
}
