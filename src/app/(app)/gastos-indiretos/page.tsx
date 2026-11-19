import type { Metadata } from 'next';
import { TelaProvisoria } from '@/features/navegacao/components/tela-provisoria';

export const metadata: Metadata = { title: 'Gastos Indiretos' };

/** Provisória: substituída pelos gastos indiretos na FE-10. */
export default function GastosIndiretosPage() {
  return (
    <TelaProvisoria
      title="Gastos Indiretos"
      subtitle="Custos rateados automaticamente nas receitas"
    />
  );
}
