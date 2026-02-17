import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Eventos de Marketing — Conferências, Workshops e Meetups no Brasil',
    template: '%s | Eventos de Marketing',
  },
  description:
    'Descubra os melhores eventos de marketing do Brasil. Conferências, workshops, meetups e webinars filtrados por cidade, tema, data e preço.',
  metadataBase: new URL(process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://eventosdemarketing.com.br'),
  openGraph: {
    siteName: 'Eventos de Marketing',
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
