import type { Metadata } from 'next';
import { TelaProvisoria } from '@/features/navegacao/components/tela-provisoria';

export const metadata: Metadata = { title: 'Estoque' };

/** Provisória: substituída pelo estoque nas FE-13 e FE-14. */
export default function EstoquePage() {
  return (
    <TelaProvisoria
      title="Estoque"
      subtitle="Acompanhe disponibilidade e alertas"
    />
  );
}
