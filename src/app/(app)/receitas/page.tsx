import type { Metadata } from 'next';
import { ReceitasLista } from '@/features/receitas/components/receitas-lista';

export const metadata: Metadata = { title: 'Receitas' };

/** A busca (`q`) é lida pela `ListPage`; criar, editar e simular são rotas próprias. */
export default function ReceitasPage() {
  return <ReceitasLista />;
}
