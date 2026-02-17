export const EVENT_CATEGORIES = [
  { value: 'CONFERENCIA', label: 'Conferência' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'MEETUP', label: 'Meetup' },
  { value: 'WEBINAR', label: 'Webinar' },
  { value: 'CURSO', label: 'Curso' },
  { value: 'PALESTRA', label: 'Palestra' },
  { value: 'HACKATHON', label: 'Hackathon' },
] as const;

export const EVENT_FORMATS = [
  { value: 'PRESENCIAL', label: 'Presencial' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'HIBRIDO', label: 'Híbrido' },
] as const;

export const EVENT_TOPICS = [
  { slug: 'growth', label: 'Growth', emoji: '🚀' },
  { slug: 'seo', label: 'SEO', emoji: '🔍' },
  { slug: 'midia-paga', label: 'Mídia Paga', emoji: '📢' },
  { slug: 'conteudo', label: 'Conteúdo', emoji: '✍️' },
  { slug: 'branding', label: 'Branding', emoji: '🎨' },
  { slug: 'inteligencia-artificial', label: 'IA', emoji: '🤖' },
  { slug: 'social-media', label: 'Social Media', emoji: '📱' },
  { slug: 'dados-e-analytics', label: 'Dados & Analytics', emoji: '📊' },
  { slug: 'crm', label: 'CRM', emoji: '🤝' },
  { slug: 'ecommerce', label: 'E-commerce', emoji: '🛒' },
  { slug: 'produto', label: 'Produto', emoji: '💡' },
  { slug: 'email-marketing', label: 'Email Marketing', emoji: '📧' },
  { slug: 'inbound-marketing', label: 'Inbound Marketing', emoji: '🧲' },
  { slug: 'performance', label: 'Performance', emoji: '⚡' },
  { slug: 'ux-e-design', label: 'UX & Design', emoji: '🎯' },
  { slug: 'video-e-streaming', label: 'Vídeo & Streaming', emoji: '🎥' },
  { slug: 'comunidade', label: 'Comunidade', emoji: '👥' },
  { slug: 'lideranca-em-marketing', label: 'Liderança em Marketing', emoji: '👔' },
] as const;

export const MAIN_CITIES = [
  { slug: 'sao-paulo', name: 'São Paulo', state: 'SP' },
  { slug: 'rio-de-janeiro', name: 'Rio de Janeiro', state: 'RJ' },
  { slug: 'belo-horizonte', name: 'Belo Horizonte', state: 'MG' },
  { slug: 'curitiba', name: 'Curitiba', state: 'PR' },
  { slug: 'porto-alegre', name: 'Porto Alegre', state: 'RS' },
  { slug: 'brasilia', name: 'Brasília', state: 'DF' },
  { slug: 'recife', name: 'Recife', state: 'PE' },
  { slug: 'florianopolis', name: 'Florianópolis', state: 'SC' },
  { slug: 'salvador', name: 'Salvador', state: 'BA' },
  { slug: 'fortaleza', name: 'Fortaleza', state: 'CE' },
  { slug: 'goiania', name: 'Goiânia', state: 'GO' },
  { slug: 'campinas', name: 'Campinas', state: 'SP' },
] as const;

export const CATEGORY_SLUG_MAP: Record<string, { slug: string; singular: string; label: string }> = {
  conferencias: { slug: 'conferencias', singular: 'CONFERENCIA', label: 'Conferências' },
  workshops: { slug: 'workshops', singular: 'WORKSHOP', label: 'Workshops' },
  meetups: { slug: 'meetups', singular: 'MEETUP', label: 'Meetups' },
  webinars: { slug: 'webinars', singular: 'WEBINAR', label: 'Webinars' },
  cursos: { slug: 'cursos', singular: 'CURSO', label: 'Cursos' },
  palestras: { slug: 'palestras', singular: 'PALESTRA', label: 'Palestras' },
  hackathons: { slug: 'hackathons', singular: 'HACKATHON', label: 'Hackathons' },
};

/** Map DB enum value (e.g. "WORKSHOP") → URL slug (e.g. "workshops") */
export const CATEGORY_SINGULAR_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.values(CATEGORY_SLUG_MAP).map((c) => [c.singular, c.slug]),
);

export const CATEGORY_SLUGS: Set<string> = new Set(Object.keys(CATEGORY_SLUG_MAP));

export const CITY_SLUG_TO_NAME: Record<string, string> = Object.fromEntries(
  MAIN_CITIES.map((c) => [c.slug, c.name]),
);

export const CITY_SLUG_TO_STATE: Record<string, string> = Object.fromEntries(
  MAIN_CITIES.map((c) => [c.slug, c.state]),
);

export const TOPIC_SLUG_TO_LABEL: Record<string, string> = Object.fromEntries(
  EVENT_TOPICS.map((t) => [t.slug, t.label]),
);

export const TOPIC_SLUGS: Set<string> = new Set(EVENT_TOPICS.map((t) => t.slug));
export const CITY_SLUGS: Set<string> = new Set(MAIN_CITIES.map((c) => c.slug));

export const CITY_NAME_TO_SLUG: Record<string, string> = Object.fromEntries(
  MAIN_CITIES.map((c) => [c.name, c.slug]),
);

/** Base URL used for canonical links, sitemap, JSON-LD, etc. */
export const SITE_URL = 'https://www.eventosdemarketing.com.br';

/** Update this date on each significant deploy */
export const SITE_LAST_UPDATED = '2026-02-17';

export const ITEMS_PER_PAGE = 10;
