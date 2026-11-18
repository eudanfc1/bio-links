import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BioLinks — Seus links em um só lugar',
  description: 'Plataforma de links em bio com histórias, avisos e anti-bot.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
