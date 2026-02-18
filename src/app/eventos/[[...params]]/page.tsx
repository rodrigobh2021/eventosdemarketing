import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import EventListingPage from '@/components/events/EventListingPage';
import { prisma } from '@/lib/prisma';
import {
  EVENT_TOPICS,
  MAIN_CITIES,
  CATEGORY_SLUG_MAP,
} from '@/lib/constants';
import {
  parseEventParams,
  buildEventUrl,
  getTemaLabel,
  getCidadeLabel,
  getCategoriaLabel,
} from '@/lib/utils';

// Revalidate at most every 24h, and on-demand via revalidatePath from admin
export const revalidate = 86400;

// ─── Static Params ────────────────────────────────────────────────────

export function generateStaticParams() {
  const combos: { params: string[] }[] = [];

  const topics = EVENT_TOPICS.map((t) => t.slug);
  const categories = Object.keys(CATEGORY_SLUG_MAP);
  const cities = MAIN_CITIES.map((c) => c.slug);

  // /eventos (no params)
  combos.push({ params: [] });

  // /eventos/[categoria]
  for (const cat of categories) {
    combos.push({ params: [cat] });

    // /eventos/[categoria]/[cidade]
    for (const cidade of cities) {
      combos.push({ params: [cat, cidade] });
    }
  }

  for (const tema of topics) {
    // /eventos/[tema]
    combos.push({ params: [tema] });

    for (const cat of categories) {
      // /eventos/[tema]/[categoria]
      combos.push({ params: [tema, cat] });

      for (const cidade of cities) {
        // /eventos/[tema]/[categoria]/[cidade]
        combos.push({ params: [tema, cat, cidade] });
      }
    }

    for (const cidade of cities) {
      // /eventos/[tema]/[cidade]
      combos.push({ params: [tema, cidade] });
    }
  }

  return combos;
}

// ─── Metadata ─────────────────────────────────────────────────────────

type MetadataProps = { params: Promise<{ params?: string[] }> };

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const { params: segments } = await params;
  const parsed = parseEventParams(segments);

  if (!parsed.valid) return {};

  const { tema, categoria, cidade } = parsed;

  const temaLabel = tema ? getTemaLabel(tema) : null;
  const catLabel = categoria ? getCategoriaLabel(categoria) : null;
  const cidadeLabel = cidade ? getCidadeLabel(cidade) : null;
  const canonical = `https://www.eventosdemarketing.com.br${buildEventUrl({ tema, categoria, cidade })}`;

  // /eventos
  if (!tema && !categoria && !cidade) {
    return {
      title: 'Eventos de Marketing 2026 | Conferencias, Workshops e Meetups',
      description:
        'Encontre os melhores eventos de marketing do Brasil. Conferencias, workshops, meetups e webinars sobre growth, SEO, midia paga, branding e muito mais.',
      alternates: { canonical },
    };
  }

  // /eventos/[categoria]
  if (catLabel && !temaLabel && !cidadeLabel) {
    const catPage = await prisma.categoryPage.findUnique({ where: { slug: categoria! } });
    return {
      title: catPage?.meta_title ?? `${catLabel} de Marketing 2026`,
      description: catPage?.meta_description ?? `Encontre ${catLabel.toLowerCase()} de marketing no Brasil. Veja a agenda completa e inscreva-se.`,
      alternates: { canonical },
    };
  }

  // /eventos/[categoria]/[cidade]
  if (catLabel && !temaLabel && cidadeLabel) {
    const cityPage = await prisma.cityPage.findUnique({ where: { slug: cidade! } });
    return {
      title: cityPage?.meta_title
        ? `${catLabel} | ${cityPage.meta_title}`
        : `${catLabel} de Marketing em ${cidadeLabel} 2026`,
      description: cityPage?.meta_description ?? `${catLabel} de marketing em ${cidadeLabel} em 2026. Veja a agenda completa e inscreva-se.`,
      alternates: { canonical },
    };
  }

  // /eventos/[tema]
  if (temaLabel && !catLabel && !cidadeLabel) {
    const topicPage = await prisma.topicPage.findUnique({ where: { slug: tema! } });
    return {
      title: topicPage?.meta_title ?? `Eventos de ${temaLabel} 2026 - Conferencias, Workshops e Meetups`,
      description: topicPage?.meta_description ?? `Encontre eventos de ${temaLabel} no Brasil. Conferencias, workshops e meetups para profissionais de ${temaLabel}. Veja agenda completa e inscreva-se.`,
      alternates: { canonical },
    };
  }

  // /eventos/[tema]/[categoria]
  if (temaLabel && catLabel && !cidadeLabel) {
    return {
      title: `${catLabel} de ${temaLabel} 2026`,
      description: `${catLabel} de ${temaLabel} no Brasil em 2026. Veja a agenda completa e inscreva-se nos melhores ${catLabel.toLowerCase()} de ${temaLabel}.`,
      alternates: { canonical },
    };
  }

  // /eventos/[tema]/[cidade]
  if (temaLabel && !catLabel && cidadeLabel) {
    return {
      title: `Eventos de ${temaLabel} em ${cidadeLabel} 2026`,
      description: `Eventos de ${temaLabel} em ${cidadeLabel} em 2026. Veja a agenda completa de conferencias, workshops e meetups de ${temaLabel} em ${cidadeLabel}. Encontre o proximo evento e inscreva-se.`,
      alternates: { canonical },
    };
  }

  // /eventos/[tema]/[categoria]/[cidade]
  return {
    title: `${catLabel} de ${temaLabel} em ${cidadeLabel} 2026`,
    description: `${catLabel} de ${temaLabel} em ${cidadeLabel} em 2026. Encontre os melhores ${catLabel?.toLowerCase()} de ${temaLabel} em ${cidadeLabel} e inscreva-se.`,
    alternates: { canonical },
  };
}

// ─── Dynamic title builder ────────────────────────────────────────────

function buildTitle(tema?: string, categoria?: string, cidade?: string): string {
  const temaLabel = tema ? getTemaLabel(tema) : null;
  const catLabel = categoria ? getCategoriaLabel(categoria) : null;
  const cidadeLabel = cidade ? getCidadeLabel(cidade) : null;

  if (catLabel && temaLabel && cidadeLabel) return `${catLabel} de ${temaLabel} em ${cidadeLabel}`;
  if (catLabel && temaLabel) return `${catLabel} de ${temaLabel}`;
  if (catLabel && cidadeLabel) return `${catLabel} de Marketing em ${cidadeLabel}`;
  if (catLabel) return `${catLabel} de Marketing`;
  if (temaLabel && cidadeLabel) return `Eventos de ${temaLabel} em ${cidadeLabel}`;
  if (temaLabel) return `Eventos de ${temaLabel}`;
  return 'Eventos de Marketing';
}

function buildSubtitle(tema?: string, categoria?: string, cidade?: string): string {
  const temaLabel = tema ? getTemaLabel(tema) : null;
  const catLabel = categoria ? getCategoriaLabel(categoria) : null;
  const cidadeLabel = cidade ? getCidadeLabel(cidade) : null;

  if (catLabel && temaLabel && cidadeLabel)
    return `${catLabel} de ${temaLabel} em ${cidadeLabel}`;
  if (catLabel && temaLabel)
    return `${catLabel} de ${temaLabel} no Brasil`;
  if (catLabel && cidadeLabel)
    return `${catLabel} de marketing em ${cidadeLabel}`;
  if (catLabel)
    return `Encontre ${catLabel.toLowerCase()} de marketing no Brasil`;
  if (temaLabel && cidadeLabel)
    return `Conferências, workshops e meetups de ${temaLabel} em ${cidadeLabel}`;
  if (temaLabel)
    return `Conferências, workshops e meetups de ${temaLabel} no Brasil`;
  return 'Todos os eventos de marketing do Brasil';
}

// ─── Page ─────────────────────────────────────────────────────────────

type Props = {
  params: Promise<{ params?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EventosCatchAllPage({ params, searchParams }: Props) {
  const { params: segments } = await params;
  const parsed = parseEventParams(segments);

  if (!parsed.valid) notFound();

  const { tema, categoria, categoriaSingular, cidade } = parsed;
  const sp = await searchParams;
  const basePath = buildEventUrl({ tema, categoria, cidade });

  return (
    <EventListingPage
      tema={tema}
      categoria={categoriaSingular}
      categoriaSlug={categoria}
      cidade={cidade}
      title={buildTitle(tema, categoria, cidade)}
      subtitle={buildSubtitle(tema, categoria, cidade)}
      basePath={basePath}
      searchParams={sp}
    />
  );
}
