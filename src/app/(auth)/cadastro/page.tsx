import type { Metadata } from 'next';
import { CadastroForm } from '@/features/auth/components/cadastro-form';
import { Card } from '@/shared/ui/card';

export const metadata: Metadata = { title: 'Criar conta' };

/** `/cadastro` (FE-48): cria a empresa com o token de cadastro e entra direto. */
export default function CadastroPage() {
  return (
    <>
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-display-lg text-ink">Criar conta</h1>
        <p className="text-body text-ink-muted">
          Cadastre sua empresa para começar a usar o LucroAI
        </p>
      </header>
      <Card className="p-5">
        <CadastroForm />
      </Card>
    </>
  );
}
