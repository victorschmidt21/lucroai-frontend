import type { Metadata } from 'next';
import { ReceitaFormPagina } from '@/features/receitas/components/receita-form';

export const metadata: Metadata = { title: 'Nova receita' };

export default function NovaReceitaPage() {
  return <ReceitaFormPagina />;
}
