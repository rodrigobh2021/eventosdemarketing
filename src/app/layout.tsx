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
  metadataBase: new URL('https://www.eventosdemarketing.com.br'),
  title: {
    default: 'Eventos de Marketing 2026 | Conferencias, Workshops e Meetups',
    template: '%s | eventosdemarketing.com.br',
  },
  description:
    'Descubra os melhores eventos de marketing do Brasil. Conferencias, workshops, meetups e webinars filtrados por cidade, tema, data e preco.',
  keywords: [
    'eventos de marketing',
    'conferencias de marketing',
    'workshops de marketing',
    'meetups de marketing',
    'eventos de marketing digital',
    'marketing digital brasil',
  ],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Eventos de Marketing',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.png'],
  },
  // TEMPORÁRIO — noindex até o lançamento público
  // Reverter para: index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1
  robots: {
    index: false,
    follow: false,
  },
  alternates: { canonical: 'https://www.eventosdemarketing.com.br' },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
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
