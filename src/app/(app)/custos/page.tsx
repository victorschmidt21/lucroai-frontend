import type { Metadata } from 'next';
import { CalculoRealTela } from '@/features/custos/components/calculo-real-tela';

export const metadata: Metadata = { title: 'Quanto custa de verdade' };

/** Aba "Custos" (FE-19): cálculo do custo real, 100% no cliente. */
export default function CustosPage() {
  return <CalculoRealTela />;
}
