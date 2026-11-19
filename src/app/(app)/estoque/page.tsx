import type { Metadata } from 'next';
import { EstoqueLista } from '@/features/estoque/components/estoque-lista';

export const metadata: Metadata = { title: 'Estoque' };

/** O filtro `baixo=1` é lido pela `EstoqueLista`, com `estoqueSearchSchema`. */
export default function EstoquePage() {
  return <EstoqueLista />;
}
