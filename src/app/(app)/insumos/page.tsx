import type { Metadata } from 'next';
import { TelaProvisoria } from '@/features/navegacao/components/tela-provisoria';

export const metadata: Metadata = { title: 'Insumos' };

/** Provisória: substituída pela listagem de insumos na FE-09. */
export default function InsumosPage() {
  return (
    <TelaProvisoria
      title="Insumos"
      subtitle="Gerencie quantidade, valor pago e custo unitário"
    />
  );
}
