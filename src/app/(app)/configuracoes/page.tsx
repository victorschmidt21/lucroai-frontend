import type { Metadata } from 'next';
import { ConfiguracoesTela } from '@/features/configuracoes/components/configuracoes-tela';

export const metadata: Metadata = { title: 'Ajustes de preço' };

export default function ConfiguracoesPage() {
  return <ConfiguracoesTela />;
}
