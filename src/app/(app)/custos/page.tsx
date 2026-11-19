import type { Metadata } from 'next';
import { CalculoRealTela } from '@/features/custos/components/calculo-real-tela';

export const metadata: Metadata = { title: 'Cálculo Real' };

/** Aba "Custos" (FE-19): cálculo do custo real, 100% no cliente. */
export default function CustosPage() {
  return <CalculoRealTela />;
}
