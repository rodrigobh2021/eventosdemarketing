import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import EventCard from '@/components/events/EventCard';
import {
  CITY_SLUGS,
  CITY_SLUG_TO_NAME,
  CITY_SLUG_TO_STATE,
  MAIN_CITIES,
  CATEGORY_SLUG_MAP,
} from '@/lib/constants';

// ─── Category pills shown on the landing page ───────────────────────

const CATEGORY_PILLS = [
  { slug: 'conferencias', label: 'Conferencias' },
  { slug: 'workshops',    label: 'Workshops'    },
  { slug: 'cursos',       label: 'Cursos'       },
  { slug: 'meetups',      label: 'Meetups'      },
  { slug: 'webinars',     label: 'Webinars'     },
  { slug: 'palestras',    label: 'Palestras'    },
  { slug: 'hackathons',   label: 'Hackathons'   },
] as const;

export const revalidate = 60;

// ─── Metadata ─────────────────────────────────────────────────────────

type MetadataProps = { params: Promise<{ cidade: string }> };

export async function generateMetadata({ params }: MetadataProps) {
  const { cidade } = await params;
  const pageData = await prisma.cityPage.findUnique({ where: { slug: cidade } });
  const cidadeLabel = CITY_SLUG_TO_NAME[cidade] ?? pageData?.city;
  if (!cidadeLabel) return {};

  const state = CITY_SLUG_TO_STATE[cidade] ?? pageData?.state ?? '';

  return {
    title: pageData?.meta_title ?? `Eventos de Marketing em ${cidadeLabel} 2026`,
    description: pageData?.meta_description ?? `Encontre eventos de marketing em ${cidadeLabel}, ${state}. Conferencias, workshops, meetups e webinars. Veja a agenda completa e inscreva-se.`,
    alternates: { canonical: `https://www.eventosdemarketing.com.br/eventos-marketing-${cidade}` },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────

type Props = {
  params: Promise<{ cidade: string }>;
};

export default async function CidadePage({ params }: Props) {
  const { cidade } = await params;

  // Support both static MAIN_CITIES and DB-registered dynamic cities
  const pageData = await prisma.cityPage.findUnique({ where: { slug: cidade } });
  if (!CITY_SLUGS.has(cidade) && !pageData) notFound();

  const cidadeLabel = CITY_SLUG_TO_NAME[cidade] ?? pageData?.city ?? cidade;
  const state = CITY_SLUG_TO_STATE[cidade] ?? pageData?.state ?? '';

  const dbCityName = cidadeLabel;
  const [events, count] = await Promise.all([
    prisma.event.findMany({
      where: { status: 'PUBLICADO', city: dbCityName, start_date: { gte: new Date() } },
      orderBy: { start_date: 'asc' },
      take: 12,
    }),
    prisma.event.count({
      where: { status: 'PUBLICADO', city: dbCityName, start_date: { gte: new Date() } },
    }),
  ]);

  // Count per category for the pills
  const categoryCounts = await prisma.event.groupBy({
    by: ['category'],
    where: { status: 'PUBLICADO', city: dbCityName, start_date: { gte: new Date() } },
    _count: true,
  });
  const countByCategory: Record<string, number> = {};
  for (const row of categoryCounts) {
    const catSlug = CATEGORY_SLUG_MAP[
      Object.entries(CATEGORY_SLUG_MAP).find(([, v]) => v.singular === row.category)?.[0] ?? ''
    ];
    if (catSlug) countByCategory[catSlug.slug] = row._count;
  }

  return (
    <div className="min-h-screen bg-bg-alt">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-primary/5 via-white to-accent/5 border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-text-secondary">
              <li className="flex items-center gap-1">
                <Link href="/" className="transition-colors hover:text-primary">Home</Link>
              </li>
              <li className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
                </svg>
                <Link href="/eventos" className="transition-colors hover:text-primary">Eventos</Link>
              </li>
              <li className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
                </svg>
                <span className="font-medium text-text">{cidadeLabel}</span>
              </li>
            </ol>
          </nav>

          <h1 className="text-3xl font-bold text-text sm:text-4xl lg:text-5xl">
            {pageData?.title ?? `Eventos de Marketing em ${cidadeLabel}`}
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-text-secondary">
            {pageData?.description ?? `Encontre conferencias, workshops, meetups e webinars de marketing em ${cidadeLabel}, ${state}.`}
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            {count} evento{count !== 1 ? 's' : ''} em {cidadeLabel}
          </p>
        </div>
      </section>

      {/* ── Category Pills ────────────────────────────────────────── */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/eventos-marketing-${cidade}`}
              className="rounded-[var(--radius-pill)] bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              Todos ({count})
            </Link>
            {CATEGORY_PILLS
              .filter((cat) => (countByCategory[cat.slug] ?? 0) > 0)
              .map((cat) => {
                const catCount = countByCategory[cat.slug]!;
                return (
                  <Link
                    key={cat.slug}
                    href={`/eventos/${cat.slug}/${cidade}`}
                    className="rounded-[var(--radius-pill)] border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-text transition-colors hover:border-primary hover:text-primary"
                  >
                    {cat.label} ({catCount})
                  </Link>
                );
              })}
          </div>
        </div>
      </section>

      {/* ── Event Grid ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-xl font-semibold text-text">
          Proximos eventos em {cidadeLabel}
        </h2>

        {events.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            {count > 12 && (
              <div className="mt-8 text-center">
                <Link
                  href={`/eventos-marketing-${cidade}`}
                  className="inline-flex items-center gap-2 rounded-[var(--radius-btn)] border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-text transition-colors hover:border-primary hover:text-primary"
                >
                  Ver todos os {count} eventos
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-[var(--radius-card)] border border-gray-200 bg-white px-6 py-16 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-text">
              Ainda nao temos eventos cadastrados em {cidadeLabel}
            </h3>
            <p className="mt-2 text-text-secondary">
              Cadastre-se para ser notificado quando um novo evento for adicionado.
            </p>
            <Link
              href="/alertas"
              className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius-btn)] bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
              Receber alertas de novos eventos
            </Link>
          </div>
        )}
      </section>

      {/* ── SEO Text ──────────────────────────────────────────────── */}
      <section className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-xl font-semibold text-text">
            Eventos de Marketing em {cidadeLabel}, {state}
          </h2>
          <div className="max-w-3xl space-y-4 text-text-secondary leading-relaxed">
            <p>
              {cidadeLabel} e um dos principais polos de marketing digital do Brasil,
              reunindo profissionais, agencias e empresas que estao na vanguarda das
              estrategias de comunicacao e growth. A cidade sedia regularmente
              conferencias, workshops, meetups e cursos voltados para areas como SEO,
              midia paga, branding, inteligencia artificial aplicada ao marketing,
              e-commerce e muito mais.
            </p>
            <p>
              No <strong>eventosdemarketing.com.br</strong>, voce encontra a agenda
              mais completa de eventos de marketing em {cidadeLabel}. Navegue por
              categoria, filtre por data ou formato (presencial, online ou hibrido)
              e descubra as melhores oportunidades de aprendizado e networking
              na regiao.
            </p>
            <p>
              Quer ficar por dentro dos novos eventos?{' '}
              <Link href="/alertas" className="font-medium text-primary hover:underline">
                Cadastre-se para receber alertas
              </Link>{' '}
              e nunca perca uma conferencia ou workshop em {cidadeLabel}.
            </p>
          </div>

          {/* Quick links to other cities */}
          <div className="mt-10">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text">
              Eventos em outras cidades
            </h3>
            <div className="flex flex-wrap gap-2">
              {MAIN_CITIES.filter((c) => c.slug !== cidade).map((c) => (
                <Link
                  key={c.slug}
                  href={`/eventos-marketing-${c.slug}`}
                  className="rounded-[var(--radius-pill)] border border-gray-200 px-3 py-1.5 text-sm text-text-secondary transition-colors hover:border-primary hover:text-primary"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
