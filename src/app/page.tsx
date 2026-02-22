import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import EventCard from '@/components/events/EventCard';
import { EVENT_TOPICS, SITE_URL } from '@/lib/constants';
import HeroCarousel from '@/components/home/HeroCarousel';
import MobileSearchBar from '@/components/home/MobileSearchBar';
import NewsletterSignup from '@/components/NewsletterSignup';
import {
  Bot,
  Share2,
  BarChart3,
  UserCheck,
  Palette,
  ShoppingCart,
  Search,
  Megaphone,
} from 'lucide-react';

export const revalidate = 60;

// ─── Data ─────────────────────────────────────────────────────────────

const HOME_TOPICS = EVENT_TOPICS.slice(0, 11);

const THEME_GRID = [
  { slug: 'inteligencia-artificial', label: 'IA',                Icon: Bot          },
  { slug: 'social-media',            label: 'Social Media',      Icon: Share2        },
  { slug: 'dados-e-analytics',       label: 'Dados & Analytics', Icon: BarChart3     },
  { slug: 'crm',                     label: 'CRM',               Icon: UserCheck     },
  { slug: 'branding',                label: 'Branding',          Icon: Palette       },
  { slug: 'ecommerce',               label: 'E-commerce',        Icon: ShoppingCart  },
  { slug: 'seo',                     label: 'SEO',               Icon: Search        },
  { slug: 'midia-paga',              label: 'Mídia Paga',        Icon: Megaphone     },
] as const;

const CITIES = [
  { slug: 'sao-paulo',      name: 'São Paulo',      state: 'SP', image: '/images/cidades/sao-paulo.jpg'      },
  { slug: 'rio-de-janeiro', name: 'Rio de Janeiro', state: 'RJ', image: '/images/cidades/rio-de-janeiro.jpg' },
  { slug: 'belo-horizonte', name: 'Belo Horizonte', state: 'MG', image: '/images/cidades/belo-horizonte.jpg' },
  { slug: 'florianopolis',  name: 'Florianópolis',  state: 'SC', image: '/images/cidades/florianopolis.webp' },
  { slug: 'salvador',       name: 'Salvador',       state: 'BA', image: '/images/cidades/salvador.jpg'       },
  { slug: 'brasilia',       name: 'Brasília',       state: 'DF', image: '/images/cidades/brasilia.jpg'       },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────

const websiteJsonLd = {
  '@context': 'https://schema.org/',
  '@type': 'WebSite',
  name: 'Eventos de Marketing',
  url: `${SITE_URL}/`,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/eventos?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Eventos de Marketing',
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/images/logo.png`,
  sameAs: `${SITE_URL}/contato`,
};

export default async function Home() {
  const events = await prisma.event.findMany({
    where: {
      status: 'PUBLICADO',
      start_date: { gte: new Date() },
    },
    orderBy: { start_date: 'asc' },
    take: 6,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      {/* ── 1. Mobile search bar (homepage only, below header) ─────── */}
      <MobileSearchBar />

      {/* ── 2. Hero ────────────────────────────────────────────────── */}
      <HeroCarousel />

      {/* ── 2. H1 ───────────────────────────────────────────────────── */}
      <section className="bg-white pt-2 sm:pt-4 pb-1">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-[19px] font-bold text-text sm:text-[23px] leading-snug">
            Descubra os melhores eventos de marketing do Brasil
          </h1>
        </div>
      </section>

      {/* ── 3. Themes ──────────────────────────────────────────────── */}
      <section className="border-b border-gray-100 bg-white pt-4 pb-8 sm:pt-5 sm:pb-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-8 sm:gap-4">
            {THEME_GRID.map(({ slug, label, Icon }) => (
              <Link
                key={slug}
                href={`${SITE_URL}/eventos/${slug}`}
                className="group flex flex-col items-center gap-2 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gray-200 bg-white transition-transform duration-200 group-hover:scale-110 sm:h-16 sm:w-16">
                  <Icon className="h-6 w-6 text-gray-500 transition-colors duration-200 group-hover:text-accent sm:h-7 sm:w-7" strokeWidth={1.5} />
                </div>
                <span className="text-xs font-medium text-gray-600 transition-colors duration-200 group-hover:text-accent leading-tight">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Featured Events ─────────────────────────────────────── */}
      <section className="bg-bg-alt py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-text sm:text-3xl">Próximos Eventos</h2>
            <p className="mt-2 text-text-secondary">
              Eventos que vão acontecer nos próximos dias
            </p>
          </div>

          {events.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-text-secondary">
              Nenhum evento próximo encontrado.
            </p>
          )}

          <div className="mt-10 text-center">
            <Link
              href={`${SITE_URL}/eventos`}
              className="inline-block rounded-[var(--radius-btn)] border border-primary px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
            >
              Ver todos os eventos
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. Cities ──────────────────────────────────────────────── */}
      <section className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-text sm:text-3xl">Explore por Cidade</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-6">
            {CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`${SITE_URL}/eventos-marketing-${city.slug}`}
                className="group relative flex h-48 items-end overflow-hidden rounded-[var(--radius-card)] sm:h-56"
              >
                {'image' in city && city.image ? (
                  <Image
                    src={city.image}
                    alt={`Eventos de marketing em ${city.name}`}
                    fill
                    quality={85}
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                ) : (
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="relative p-4">
                  <h3 className="text-lg font-bold text-white sm:text-xl">{city.name}</h3>
                  <span className="text-sm text-white/70">{city.state}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. CTA Organizers ──────────────────────────────────────── */}
      <section className="bg-primary px-4 py-14 text-center sm:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Você organiza eventos de marketing?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-blue-100">
            Cadastre seu evento gratuitamente e alcance milhares de profissionais de marketing.
          </p>
          <Link
            href={`${SITE_URL}/para-organizadores`}
            className="mt-8 inline-block rounded-[var(--radius-btn)] bg-white px-8 py-3.5 text-sm font-semibold text-primary transition-colors hover:bg-blue-50"
          >
            Cadastrar meu evento
          </Link>
        </div>
      </section>

      {/* ── 6. CTA Notifications ───────────────────────────────────── */}
      <NewsletterSignup variant="light" />
    </>
  );
}
