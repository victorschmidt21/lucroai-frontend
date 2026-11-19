import type { Metadata } from 'next';
import { TelaProvisoria } from '@/features/navegacao/components/tela-provisoria';

export const metadata: Metadata = { title: 'Cálculo Real' };

/** Provisória: substituída pelo cálculo real na FE-19. */
export default function CustosPage() {
  return (
    <TelaProvisoria
      title="Cálculo Real"
      subtitle="Custo verdadeiro incluindo custos invisíveis"
    />
  );
}
