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
  console.log('── Seeding category pages ───────────────────────────');
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
