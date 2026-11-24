import type { Metadata } from 'next';
import { AprenderTela } from '@/features/aprender/components/aprender-tela';

export const metadata: Metadata = { title: 'Aprender' };

/** A busca (`q`) e o assunto (`assunto`) são lidos pela `AprenderTela`, com `aprenderSearchSchema`. */
export default function AprenderPage() {
  return <AprenderTela />;
}
