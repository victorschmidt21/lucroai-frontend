import { Roboto } from 'next/font/google';

// Roboto é a fonte padrão do Material no Flutter. O `next/font` hospeda os
// arquivos no próprio servidor: o navegador não chama o Google.
export const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-roboto',
  display: 'swap',
});
