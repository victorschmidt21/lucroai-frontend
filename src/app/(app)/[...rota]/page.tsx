import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

// Só o `not-found.tsx` da raiz aceita `metadata`: o título do 404 dentro do
// layout fica aqui.
export const metadata: Metadata = { title: 'Página não encontrada' };

/**
 * Qualquer rota sem página cai aqui, dentro do layout de `(app)`: o 404 aparece
 * com o menu (`(app)/not-found.tsx`), e só para quem tem sessão.
 */
export default function RotaInexistente(): never {
  notFound();
}
