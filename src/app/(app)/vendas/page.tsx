import type { Metadata } from 'next';
import { TelaProvisoria } from '@/features/navegacao/components/tela-provisoria';

export const metadata: Metadata = { title: 'Vendas' };

/** Provisória: substituída pelas vendas nas FE-16 a FE-18. */
export default function VendasPage() {
  return (
    <TelaProvisoria
      title="Vendas"
      subtitle="Registre vendas e acompanhe o histórico"
    />
  );
}
