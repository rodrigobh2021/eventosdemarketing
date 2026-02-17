import { notFound } from 'next/navigation';
import EventListingPage from '@/components/events/EventListingPage';
import {
  CITY_SLUGS,
  CITY_SLUG_TO_NAME,
  MAIN_CITIES,
} from '@/lib/constants';

// ─── Static Params ────────────────────────────────────────────────────

export function generateStaticParams() {
  return MAIN_CITIES.map((c) => ({ cidade: c.slug }));
}

// ─── Metadata ─────────────────────────────────────────────────────────

type MetadataProps = { params: Promise<{ cidade: string }> };

export async function generateMetadata({ params }: MetadataProps) {
  const { cidade } = await params;
  const cidadeLabel = CITY_SLUG_TO_NAME[cidade];
  if (!cidadeLabel) return {};

  return {
    title: `Eventos de Marketing em ${cidadeLabel} 2026 | eventosdemarketing.com.br`,
    description: `Encontre eventos de marketing em ${cidadeLabel}. Conferências, workshops, meetups e webinars. Veja a agenda completa e inscreva-se.`,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────

type Props = {
  params: Promise<{ cidade: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CidadePage({ params, searchParams }: Props) {
  const { cidade } = await params;

  if (!CITY_SLUGS.has(cidade)) notFound();

  const cidadeLabel = CITY_SLUG_TO_NAME[cidade]!;
  const sp = await searchParams;

  return (
    <EventListingPage
      cidade={cidade}
      title={`Eventos de Marketing em ${cidadeLabel}`}
      subtitle={`Conferências, workshops e meetups de marketing em ${cidadeLabel}`}
      basePath={`/eventos-marketing-${cidade}`}
      searchParams={sp}
    />
  );
}
