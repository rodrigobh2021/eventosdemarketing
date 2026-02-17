import { PrismaClient } from '../src/generated/prisma/client.js';
import { EventCategory, EventFormat, EventStatus } from '../src/generated/prisma/enums.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { randomUUID } from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
const prisma = new PrismaClient({ adapter });

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function main() {
  console.log('Limpando dados existentes...');
  await prisma.eventSubmission.deleteMany();
  await prisma.organizer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.event.deleteMany();

  // ─── Eventos ─────────────────────────────────────────────────────

  console.log('Criando eventos...');
  const events = await prisma.event.createMany({
    data: [
      // 1 — SP, Conferência, Presencial, Pago
      {
        slug: 'growth-conference-2026-sao-paulo',
        title: 'Growth Conference 2026',
        description:
          '<p>O maior evento de growth marketing do Brasil. Dois dias de palestras, painéis e networking com os maiores nomes de growth hacking, aquisição e retenção do país.</p>',
        start_date: daysFromNow(3),
        end_date: daysFromNow(4),
        start_time: '09:00',
        end_time: '18:00',
        city: 'São Paulo',
        state: 'SP',
        address: 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP',
        latitude: -23.5629,
        longitude: -46.6544,
        venue_name: 'Centro de Convenções Rebouças',
        category: EventCategory.CONFERENCIA,
        topics: ['growth', 'dados-e-analytics', 'performance'],
        is_free: false,
        price_info: 'A partir de R$ 497',
        ticket_url: 'https://exemplo.com/growth-conference-2026',
        event_url: 'https://growthconf.com.br',
        organizer_name: 'Growth Labs Brasil',
        organizer_url: 'https://growthlabs.com.br',
        format: EventFormat.PRESENCIAL,
        status: EventStatus.PUBLICADO,
        is_verified: true,
        interest_count: 234,
      },
      // 2 — SP, Workshop, Presencial, Pago
      {
        slug: 'workshop-ia-para-marketers-sao-paulo',
        title: 'Workshop de IA para Marketers',
        description:
          '<p>Workshop hands-on de um dia inteiro sobre como usar inteligência artificial no dia a dia do marketing. ChatGPT, Midjourney, automações com IA e muito mais.</p>',
        start_date: daysFromNow(5),
        start_time: '09:00',
        end_time: '17:00',
        city: 'São Paulo',
        state: 'SP',
        address: 'Rua Augusta, 2690 - Cerqueira César, São Paulo - SP',
        latitude: -23.5568,
        longitude: -46.6629,
        venue_name: 'WeWork Paulista',
        category: EventCategory.WORKSHOP,
        topics: ['inteligencia-artificial', 'conteudo', 'performance'],
        is_free: false,
        price_info: 'R$ 297',
        ticket_url: 'https://exemplo.com/workshop-ia-marketers',
        organizer_name: 'MarketingTech Academy',
        format: EventFormat.PRESENCIAL,
        status: EventStatus.PUBLICADO,
        is_verified: true,
        interest_count: 89,
      },
      // 3 — SP, Meetup, Presencial, Gratuito
      {
        slug: 'meetup-midia-paga-sp-fevereiro-2026',
        title: 'Meetup de Mídia Paga - SP',
        description:
          '<p>Encontro mensal da comunidade de mídia paga de São Paulo. Três talks de 20 minutos sobre Google Ads, Meta Ads e TikTok Ads, seguido de networking com pizza e cerveja.</p>',
        start_date: daysFromNow(2),
        start_time: '19:00',
        end_time: '22:00',
        city: 'São Paulo',
        state: 'SP',
        address: 'Rua Gomes de Carvalho, 1306 - Vila Olímpia, São Paulo - SP',
        latitude: -23.5952,
        longitude: -46.6819,
        venue_name: 'Google for Startups Campus',
        category: EventCategory.MEETUP,
        topics: ['midia-paga', 'performance'],
        is_free: true,
        organizer_name: 'Comunidade Paid Media Brasil',
        format: EventFormat.PRESENCIAL,
        status: EventStatus.PUBLICADO,
        is_verified: true,
        interest_count: 156,
      },
      // 4 — RJ, Conferência, Presencial, Pago
      {
        slug: 'seo-summit-rio-de-janeiro-2026',
        title: 'SEO Summit Rio 2026',
        description:
          '<p>A conferência de SEO mais relevante do Rio de Janeiro. Speakers nacionais e internacionais compartilham estratégias avançadas de busca orgânica, SEO técnico e content strategy.</p>',
        start_date: daysFromNow(10),
        end_date: daysFromNow(11),
        start_time: '08:30',
        end_time: '18:00',
        city: 'Rio de Janeiro',
        state: 'RJ',
        address: 'Av. Atlântica, 1702 - Copacabana, Rio de Janeiro - RJ',
        latitude: -22.9671,
        longitude: -43.1787,
        venue_name: 'Windsor Atlântica Hotel',
        category: EventCategory.CONFERENCIA,
        topics: ['seo', 'conteudo', 'dados-e-analytics'],
        is_free: false,
        price_info: 'A partir de R$ 397',
        ticket_url: 'https://exemplo.com/seo-summit-rio',
        event_url: 'https://seosummit.com.br',
        organizer_name: 'Search Brasil',
        organizer_url: 'https://searchbrasil.com.br',
        format: EventFormat.PRESENCIAL,
        status: EventStatus.PUBLICADO,
        is_verified: true,
        interest_count: 178,
      },
      // 5 — RJ, Meetup, Presencial, Gratuito
      {
        slug: 'meetup-social-media-rio-de-janeiro',
        title: 'Meetup Social Media Rio',
        description:
          '<p>Encontro trimestral dos profissionais de social media do Rio. Cases reais de grandes marcas, tendências de plataformas e networking descontraído na Lapa.</p>',
        start_date: daysFromNow(8),
        start_time: '19:00',
        end_time: '21:30',
        city: 'Rio de Janeiro',
        state: 'RJ',
        address: 'Rua do Lavradio, 71 - Centro, Rio de Janeiro - RJ',
        latitude: -22.9104,
        longitude: -43.1834,
        venue_name: 'Coworking Lab Carioca',
        category: EventCategory.MEETUP,
        topics: ['social-media', 'conteudo', 'comunidade'],
        is_free: true,
        organizer_name: 'Social Carioca',
        format: EventFormat.PRESENCIAL,
        status: EventStatus.PUBLICADO,
        is_verified: false,
        interest_count: 67,
      },
      // 6 — BH, Workshop, Presencial, Pago
      {
        slug: 'workshop-branding-estrategico-belo-horizonte',
        title: 'Workshop de Branding Estratégico',
        description:
          '<p>Um dia completo de imersão em branding. Aprenda a construir marcas memoráveis com posicionamento, identidade verbal e design system. Inclui exercícios práticos com sua própria marca.</p>',
        start_date: daysFromNow(14),
        start_time: '09:00',
        end_time: '17:00',
        city: 'Belo Horizonte',
        state: 'MG',
        address: 'Rua da Bahia, 1148 - Centro, Belo Horizonte - MG',
        latitude: -19.919,
        longitude: -43.9386,
        venue_name: 'FIEMG Hub',
        category: EventCategory.WORKSHOP,
        topics: ['branding', 'ux-e-design'],
        is_free: false,
        price_info: 'R$ 249',
        ticket_url: 'https://exemplo.com/workshop-branding-bh',
        organizer_name: 'Criaminas',
        format: EventFormat.PRESENCIAL,
        status: EventStatus.PUBLICADO,
        is_verified: false,
        interest_count: 42,
      },
      // 7 — BH, Palestra, Presencial, Gratuito
      {
        slug: 'palestra-dados-analytics-marketing-belo-horizonte',
        title: 'Data-Driven Marketing: da Teoria à Prática',
        description:
          '<p>Palestra gratuita sobre como usar dados e analytics para tomar melhores decisões de marketing. GA4, dashboards, atribuição e cultura data-driven em empresas brasileiras.</p>',
        start_date: daysFromNow(6),
        start_time: '19:00',
        end_time: '21:00',
        city: 'Belo Horizonte',
        state: 'MG',
        address: 'Av. do Contorno, 6594 - Savassi, Belo Horizonte - MG',
        latitude: -19.9352,
        longitude: -43.9335,
        venue_name: 'San Pedro Valley Hub',
        category: EventCategory.PALESTRA,
        topics: ['dados-e-analytics', 'performance'],
        is_free: true,
        organizer_name: 'Analytics MG',
        format: EventFormat.PRESENCIAL,
        status: EventStatus.PUBLICADO,
        is_verified: true,
        interest_count: 93,
      },
      // 8 — Curitiba, Conferência, Presencial, Pago
      {
        slug: 'marketing-digital-experience-curitiba-2026',
        title: 'Marketing Digital Experience Curitiba 2026',
        description:
          '<p>A principal conferência de marketing digital do sul do Brasil. Dois dias com trilhas de conteúdo, performance, CRM, e-commerce e liderança em marketing.</p>',
        start_date: daysFromNow(20),
        end_date: daysFromNow(21),
        start_time: '08:00',
        end_time: '18:00',
        city: 'Curitiba',
        state: 'PR',
        address: 'Rua XV de Novembro, 971 - Centro, Curitiba - PR',
        latitude: -25.4295,
        longitude: -49.2713,
        venue_name: 'Expo Unimed Curitiba',
        category: EventCategory.CONFERENCIA,
        topics: ['performance', 'crm', 'ecommerce', 'lideranca-em-marketing'],
        is_free: false,
        price_info: 'A partir de R$ 347 (lote 1)',
        ticket_url: 'https://exemplo.com/mde-curitiba-2026',
        event_url: 'https://mdexperience.com.br',
        organizer_name: 'Digital South',
        organizer_url: 'https://digitalsouth.com.br',
        format: EventFormat.PRESENCIAL,
        status: EventStatus.PUBLICADO,
        is_verified: true,
        interest_count: 145,
      },
      // 9 — Curitiba, Curso, Presencial, Pago
      {
        slug: 'curso-inbound-marketing-curitiba',
        title: 'Curso Intensivo de Inbound Marketing',
        description:
          '<p>Três noites de curso intensivo sobre inbound marketing. Funil de vendas, lead scoring, automação de marketing, nutrição de leads e métricas de inbound.</p>',
        start_date: daysFromNow(12),
        end_date: daysFromNow(14),
        start_time: '19:00',
        end_time: '22:00',
        city: 'Curitiba',
        state: 'PR',
        address: 'Av. Sete de Setembro, 3165 - Rebouças, Curitiba - PR',
        latitude: -25.4479,
        longitude: -49.2777,
        venue_name: 'PUCPR - Câmpus Curitiba',
        category: EventCategory.CURSO,
        topics: ['inbound-marketing', 'email-marketing', 'crm'],
        is_free: false,
        price_info: 'R$ 450 (3 noites)',
        ticket_url: 'https://exemplo.com/curso-inbound-curitiba',
        organizer_name: 'Inbound Academy BR',
        format: EventFormat.PRESENCIAL,
        status: EventStatus.PUBLICADO,
        is_verified: false,
        interest_count: 31,
      },
      // 10 — Online, Webinar, Gratuito
      {
        slug: 'webinar-tendencias-marketing-2026',
        title: 'Tendências de Marketing Digital para 2026',
        description:
          '<p>Webinar gratuito com painel de 4 especialistas discutindo as principais tendências de marketing digital: IA generativa, busca por voz, social commerce e first-party data.</p>',
        start_date: daysFromNow(1),
        start_time: '14:00',
        end_time: '15:30',
        city: 'Online',
        state: 'BR',
        category: EventCategory.WEBINAR,
        topics: ['inteligencia-artificial', 'social-media', 'dados-e-analytics'],
        is_free: true,
        event_url: 'https://exemplo.com/webinar-tendencias-2026',
        organizer_name: 'MarketingTech Academy',
        format: EventFormat.ONLINE,
        status: EventStatus.PUBLICADO,
        is_verified: true,
        interest_count: 412,
      },
      // 11 — Online, Workshop, Pago
      {
        slug: 'workshop-google-ads-avancado-online',
        title: 'Google Ads Avançado: Performance Max e IA',
        description:
          '<p>Workshop online de 4 horas sobre as funcionalidades avançadas do Google Ads. Performance Max, estratégias de lance com IA, audiências preditivas e scripts para automação.</p>',
        start_date: daysFromNow(7),
        start_time: '09:00',
        end_time: '13:00',
        city: 'Online',
        state: 'BR',
        category: EventCategory.WORKSHOP,
        topics: ['midia-paga', 'inteligencia-artificial', 'performance'],
        is_free: false,
        price_info: 'R$ 197',
        ticket_url: 'https://exemplo.com/workshop-google-ads',
        organizer_name: 'Ads Pro School',
        format: EventFormat.ONLINE,
        status: EventStatus.PUBLICADO,
        is_verified: false,
        interest_count: 76,
      },
      // 12 — Online, Webinar, Gratuito
      {
        slug: 'webinar-email-marketing-que-converte',
        title: 'Email Marketing que Converte: Estratégias para 2026',
        description:
          '<p>Webinar prático sobre como criar campanhas de email marketing com alta taxa de abertura e conversão. Segmentação, copywriting, automações e entregabilidade.</p>',
        start_date: daysFromNow(4),
        start_time: '10:00',
        end_time: '11:30',
        city: 'Online',
        state: 'BR',
        category: EventCategory.WEBINAR,
        topics: ['email-marketing', 'conteudo', 'crm'],
        is_free: true,
        event_url: 'https://exemplo.com/webinar-email-marketing',
        organizer_name: 'Mailfy Brasil',
        format: EventFormat.ONLINE,
        status: EventStatus.PUBLICADO,
        is_verified: true,
        interest_count: 203,
      },
      // 13 — SP, Hackathon, Híbrido, Gratuito
      {
        slug: 'hackathon-marketing-ia-sao-paulo-2026',
        title: 'Hackathon Marketing + IA 2026',
        description:
          '<p>48 horas para criar soluções de marketing usando inteligência artificial. Equipes de até 5 pessoas, mentoria de especialistas, prêmios de até R$ 10.000. Participação presencial ou remota.</p>',
        start_date: daysFromNow(25),
        end_date: daysFromNow(27),
        start_time: '08:00',
        end_time: '20:00',
        city: 'São Paulo',
        state: 'SP',
        address: 'Rua Bela Cintra, 986 - Consolação, São Paulo - SP',
        latitude: -23.5558,
        longitude: -46.6601,
        venue_name: 'Cubo Itaú',
        category: EventCategory.HACKATHON,
        topics: ['inteligencia-artificial', 'growth', 'produto'],
        is_free: true,
        event_url: 'https://exemplo.com/hackathon-mkt-ia',
        organizer_name: 'Growth Labs Brasil',
        organizer_url: 'https://growthlabs.com.br',
        format: EventFormat.HIBRIDO,
        status: EventStatus.PUBLICADO,
        is_verified: true,
        interest_count: 289,
      },
      // 14 — RJ, Curso, Presencial, Pago
      {
        slug: 'curso-social-media-management-rio-de-janeiro',
        title: 'Curso de Social Media Management',
        description:
          '<p>Formação completa em gestão de redes sociais. Planejamento de conteúdo, ferramentas de agendamento, métricas, SAC 2.0 e gerenciamento de crises. Duas semanas, terças e quintas.</p>',
        start_date: daysFromNow(15),
        end_date: daysFromNow(25),
        start_time: '19:00',
        end_time: '22:00',
        city: 'Rio de Janeiro',
        state: 'RJ',
        address: 'Rua Voluntários da Pátria, 190 - Botafogo, Rio de Janeiro - RJ',
        latitude: -22.9519,
        longitude: -43.1852,
        venue_name: 'Escola Superior de Propaganda e Marketing',
        category: EventCategory.CURSO,
        topics: ['social-media', 'conteudo', 'comunidade'],
        is_free: false,
        price_info: 'R$ 890 (ou 3x de R$ 297)',
        ticket_url: 'https://exemplo.com/curso-social-media-rj',
        organizer_name: 'Social Carioca',
        format: EventFormat.PRESENCIAL,
        status: EventStatus.PUBLICADO,
        is_verified: false,
        interest_count: 54,
      },
      // 15 — SP, Conferência, Híbrido, Pago
      {
        slug: 'ecommerce-marketing-summit-sao-paulo-2026',
        title: 'E-commerce Marketing Summit 2026',
        description:
          '<p>A conferência definitiva sobre marketing para e-commerce. Estratégias de aquisição, retenção, CRM, logística reversa, marketplaces e D2C. Presencial em SP com transmissão online.</p>',
        start_date: daysFromNow(30),
        start_time: '08:00',
        end_time: '18:30',
        city: 'São Paulo',
        state: 'SP',
        address: 'Av. Nações Unidas, 12901 - Brooklin, São Paulo - SP',
        latitude: -23.6074,
        longitude: -46.6976,
        venue_name: 'WTC Events Center',
        category: EventCategory.CONFERENCIA,
        topics: ['ecommerce', 'crm', 'midia-paga', 'growth'],
        is_free: false,
        price_info: 'Presencial: R$ 597 | Online: R$ 197',
        ticket_url: 'https://exemplo.com/ecommerce-summit-2026',
        event_url: 'https://ecommercesummit.com.br',
        organizer_name: 'Digital South',
        organizer_url: 'https://digitalsouth.com.br',
        format: EventFormat.HIBRIDO,
        status: EventStatus.PUBLICADO,
        is_verified: true,
        interest_count: 167,
      },
    ],
  });

  console.log(`  ${events.count} eventos criados`);

  // ─── Usuários (subscribers) ──────────────────────────────────────

  console.log('Criando usuários...');
  const users = await prisma.user.createMany({
    data: [
      {
        email: 'marina.costa@gmail.com',
        name: 'Marina Costa',
        cities_of_interest: ['São Paulo', 'Online'],
        topics_of_interest: ['growth', 'performance', 'midia-paga'],
        notify_free_only: false,
        email_verified: true,
        unsubscribe_token: randomUUID(),
      },
      {
        email: 'pedro.henrique.mkt@outlook.com',
        name: 'Pedro Henrique Alves',
        cities_of_interest: ['Rio de Janeiro', 'Online'],
        topics_of_interest: ['seo', 'conteudo', 'social-media'],
        notify_free_only: true,
        email_verified: true,
        unsubscribe_token: randomUUID(),
      },
      {
        email: 'juliana.branding@yahoo.com.br',
        name: 'Juliana Ferreira',
        cities_of_interest: ['Belo Horizonte', 'São Paulo'],
        topics_of_interest: ['branding', 'ux-e-design', 'conteudo'],
        notify_free_only: false,
        email_verified: true,
        unsubscribe_token: randomUUID(),
      },
      {
        email: 'rafael.dados@gmail.com',
        name: 'Rafael Mendes',
        cities_of_interest: ['Curitiba', 'São Paulo', 'Online'],
        topics_of_interest: ['dados-e-analytics', 'inteligencia-artificial', 'growth'],
        notify_free_only: true,
        email_verified: true,
        unsubscribe_token: randomUUID(),
      },
      {
        email: 'camila.social@hotmail.com',
        name: 'Camila Ribeiro',
        cities_of_interest: ['São Paulo', 'Rio de Janeiro', 'Online'],
        topics_of_interest: ['social-media', 'email-marketing', 'inbound-marketing'],
        notify_free_only: false,
        email_verified: true,
        unsubscribe_token: randomUUID(),
      },
    ],
  });

  console.log(`  ${users.count} usuários criados`);

  // ─── Organizadores ───────────────────────────────────────────────

  console.log('Criando organizadores...');
  const organizers = await prisma.organizer.createMany({
    data: [
      {
        name: 'Lucas Martins',
        email: 'lucas@growthlabs.com.br',
        company: 'Growth Labs Brasil',
        website: 'https://growthlabs.com.br',
        is_approved: true,
        auth_provider: 'google',
      },
      {
        name: 'Fernanda Oliveira',
        email: 'fernanda@digitalsouth.com.br',
        company: 'Digital South',
        website: 'https://digitalsouth.com.br',
        is_approved: true,
        auth_provider: 'google',
      },
      {
        name: 'Thiago Souza',
        email: 'thiago@searchbrasil.com.br',
        company: 'Search Brasil',
        website: 'https://searchbrasil.com.br',
        is_approved: true,
        auth_provider: 'email',
      },
    ],
  });

  console.log(`  ${organizers.count} organizadores criados`);

  console.log('Seed concluído!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
