import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    // TEMPORÁRIO — bloqueia indexação até o lançamento público
    // Reverter para allow: '/' e disallow parcial quando pronto
    rules: {
      userAgent: '*',
      disallow: '/',
    },
    sitemap: 'https://www.eventosdemarketing.com.br/sitemap.xml',
  };
}
