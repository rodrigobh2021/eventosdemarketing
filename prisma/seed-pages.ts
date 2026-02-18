/**
 * Popula as tabelas category_pages e city_pages com os valores padrão
 * definidos nas constantes do projeto.
 *
 * Usa upsert — não sobrescreve campos personalizados (meta_title, meta_description,
 * description) que já tenham sido editados pelo admin.
 *
 * Execute: npx tsx prisma/seed-pages.ts
 */
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
const prisma = new PrismaClient({ adapter });

const TOPIC_DEFAULTS = [
  { topic: 'growth',                slug: 'growth',                title: 'Eventos de Growth Marketing'           },
  { topic: 'seo',                   slug: 'seo',                   title: 'Eventos de SEO'                        },
  { topic: 'midia-paga',            slug: 'midia-paga',            title: 'Eventos de Mídia Paga'                 },
  { topic: 'conteudo',              slug: 'conteudo',              title: 'Eventos de Marketing de Conteúdo'      },
  { topic: 'branding',              slug: 'branding',              title: 'Eventos de Branding'                   },
  { topic: 'inteligencia-artificial', slug: 'inteligencia-artificial', title: 'Eventos de IA no Marketing'        },
  { topic: 'social-media',         slug: 'social-media',          title: 'Eventos de Social Media'               },
  { topic: 'dados-e-analytics',    slug: 'dados-e-analytics',     title: 'Eventos de Dados e Analytics'          },
  { topic: 'crm',                   slug: 'crm',                   title: 'Eventos de CRM'                        },
  { topic: 'ecommerce',             slug: 'ecommerce',             title: 'Eventos de E-commerce'                 },
  { topic: 'produto',               slug: 'produto',               title: 'Eventos de Produto'                    },
  { topic: 'email-marketing',       slug: 'email-marketing',       title: 'Eventos de Email Marketing'            },
  { topic: 'inbound-marketing',     slug: 'inbound-marketing',     title: 'Eventos de Inbound Marketing'          },
  { topic: 'performance',           slug: 'performance',           title: 'Eventos de Marketing de Performance'   },
  { topic: 'ux-e-design',          slug: 'ux-e-design',           title: 'Eventos de UX e Design'                },
  { topic: 'video-e-streaming',    slug: 'video-e-streaming',     title: 'Eventos de Vídeo e Streaming'          },
  { topic: 'comunidade',            slug: 'comunidade',            title: 'Eventos de Comunidade'                 },
  { topic: 'lideranca-em-marketing', slug: 'lideranca-em-marketing', title: 'Eventos de Liderança em Marketing'  },
] as const;

const CATEGORY_DEFAULTS = [
  { category: 'CONFERENCIA', slug: 'conferencias', title: 'Conferências de Marketing' },
  { category: 'WORKSHOP',    slug: 'workshops',    title: 'Workshops de Marketing'    },
  { category: 'MEETUP',      slug: 'meetups',      title: 'Meetups de Marketing'      },
  { category: 'WEBINAR',     slug: 'webinars',     title: 'Webinars de Marketing'     },
  { category: 'CURSO',       slug: 'cursos',       title: 'Cursos de Marketing'       },
  { category: 'PALESTRA',    slug: 'palestras',    title: 'Palestras de Marketing'    },
  { category: 'HACKATHON',   slug: 'hackathons',   title: 'Hackathons de Marketing'   },
] as const;

const CITY_DEFAULTS = [
  { city: 'São Paulo',      state: 'SP', slug: 'sao-paulo',       title: 'Eventos de Marketing em São Paulo'      },
  { city: 'Rio de Janeiro', state: 'RJ', slug: 'rio-de-janeiro',  title: 'Eventos de Marketing no Rio de Janeiro' },
  { city: 'Belo Horizonte', state: 'MG', slug: 'belo-horizonte',  title: 'Eventos de Marketing em Belo Horizonte' },
  { city: 'Curitiba',       state: 'PR', slug: 'curitiba',        title: 'Eventos de Marketing em Curitiba'       },
  { city: 'Porto Alegre',   state: 'RS', slug: 'porto-alegre',    title: 'Eventos de Marketing em Porto Alegre'   },
  { city: 'Brasília',       state: 'DF', slug: 'brasilia',        title: 'Eventos de Marketing em Brasília'       },
  { city: 'Recife',         state: 'PE', slug: 'recife',          title: 'Eventos de Marketing em Recife'         },
  { city: 'Florianópolis',  state: 'SC', slug: 'florianopolis',   title: 'Eventos de Marketing em Florianópolis'  },
  { city: 'Salvador',       state: 'BA', slug: 'salvador',        title: 'Eventos de Marketing em Salvador'       },
  { city: 'Fortaleza',      state: 'CE', slug: 'fortaleza',       title: 'Eventos de Marketing em Fortaleza'      },
  { city: 'Goiânia',        state: 'GO', slug: 'goiania',         title: 'Eventos de Marketing em Goiânia'        },
  { city: 'Campinas',       state: 'SP', slug: 'campinas',        title: 'Eventos de Marketing em Campinas'       },
] as const;

async function main() {
  console.log('── Seeding topic pages ──────────────────────────────');
  for (const t of TOPIC_DEFAULTS) {
    await prisma.topicPage.upsert({
      where: { topic: t.topic },
      create: { topic: t.topic, slug: t.slug, title: t.title },
      update: { slug: t.slug, title: t.title },
    });
    console.log(`  ✓ ${t.topic}`);
  }

  console.log('\n── Seeding category pages ───────────────────────────');
  for (const c of CATEGORY_DEFAULTS) {
    await prisma.categoryPage.upsert({
      where: { category: c.category },
      create: { category: c.category, slug: c.slug, title: c.title },
      // On update: only refresh slug/title, never overwrite custom meta fields
      update: { slug: c.slug, title: c.title },
    });
    console.log(`  ✓ ${c.category} → /${c.slug}`);
  }

  console.log('\n── Seeding city pages ───────────────────────────────');
  for (const c of CITY_DEFAULTS) {
    await prisma.cityPage.upsert({
      where: { city_state: { city: c.city, state: c.state } },
      create: { city: c.city, state: c.state, slug: c.slug, title: c.title },
      update: { slug: c.slug, title: c.title },
    });
    console.log(`  ✓ ${c.city} (${c.state}) → /${c.slug}`);
  }

  console.log('\nDone!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
