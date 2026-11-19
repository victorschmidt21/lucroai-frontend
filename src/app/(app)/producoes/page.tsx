import type { Metadata } from 'next';
import { TelaProvisoria } from '@/features/navegacao/components/tela-provisoria';

export const metadata: Metadata = { title: 'Produções' };

/** Provisória: substituída pelas produções na FE-15. */
export default function ProducoesPage() {
  return (
    <TelaProvisoria
      title="Produções"
      subtitle="Registre e acompanhe suas produções"
    />
  );
}
