import type { Metadata } from 'next';
import { TelaProvisoria } from '@/features/navegacao/components/tela-provisoria';

export const metadata: Metadata = { title: 'Receitas' };

/** Provisória: substituída pela listagem de receitas na FE-11. */
export default function ReceitasPage() {
  return (
    <TelaProvisoria
      title="Receitas"
      subtitle="Gerencie insumos, rendimento, margem e custo automático"
    />
  );
}
