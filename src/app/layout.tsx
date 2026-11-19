import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { publicEnv } from '@/shared/config/env.public';
import { roboto } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_APP_URL),
  title: 'LucroAI',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={roboto.variable}>
      <body className="bg-bg font-sans text-body text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
