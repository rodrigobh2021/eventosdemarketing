# CONTEXT.md — eventosdemarketing.com.br

## Sobre o Projeto

**eventosdemarketing.com.br** é uma plataforma web que centraliza eventos de marketing no Brasil. Permite que profissionais da área descubram conferências, workshops, meetups e outros eventos — filtrando por cidade, tema, data, formato e preço. Organizadores podem cadastrar seus eventos, e um agente de scraping com IA auxilia na extração automática de dados de sites de eventos.

### Proposta de valor

> "Nunca mais perca um evento de marketing. Descubra conferências, workshops e meetups da sua cidade — filtrados por tema, data e preço."

### Público-alvo

- **Usuários**: Profissionais de marketing, growth, conteúdo, mídia paga, SEO, branding, CRM, dados, produto e áreas correlatas
- **Organizadores**: Empresas e pessoas que organizam eventos de marketing (conferências, workshops, cursos, meetups, webinars)

---

## Stack Tecnológica

| Camada             | Tecnologia              | Versão / Detalhe                  |
| ------------------ | ----------------------- | --------------------------------- |
| Framework          | Next.js (App Router)    | 15+ com React 19                  |
| Linguagem          | TypeScript              | 5+ (strict mode)                  |
| Estilização        | Tailwind CSS            | v4 (`@import "tailwindcss"`)      |
| Banco de dados     | PostgreSQL              | via Supabase                      |
| ORM                | Prisma                  | com adapter `@prisma/adapter-pg`  |
| Agente de scraping | Claude API + Playwright | claude-sonnet-4-6                 |
| Calendário (.ics)  | ical-generator          | —                                 |
| Deploy             | Vercel                  | —                                 |

---

## Estrutura de Pastas (Real)

```
eventos_mkt/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                    # Desativado — ver comentário no arquivo
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Layout raiz (noindex temporário)
│   │   ├── page.tsx               # Home
│   │   ├── robots.ts              # Disallow: / (temporário)
│   │   ├── sitemap.ts             # Sitemap dinâmico (DB + estático)
│   │   ├── middleware.ts          # Basic Auth (proteção temporária)
│   │   ├── evento/[slug]/         # Página do evento
│   │   ├── eventos/[[...params]]/ # Listagem com filtros (catch-all)
│   │   ├── cidade/[cidade]/       # Landing pages por cidade (DB-aware)
│   │   ├── cadastrar-evento/      # Formulário de submissão unificado
│   │   ├── admin/                 # Painel admin (sem auth — Fase 4)
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── events/        # CRUD de eventos
│   │   │   │   ├── submissions/[id]/approve/  # Aprovação + auto-CityPage
│   │   │   │   ├── categories/    # CRUD de CategoryPage
│   │   │   │   ├── cities/        # CRUD de CityPage
│   │   │   │   └── topics/        # CRUD de TopicPage
│   │   │   ├── events/[slug]/calendar/  # Download .ics
│   │   │   └── agent/scrape/      # Agente de scraping
│   ├── components/
│   │   ├── layout/                # Header, Footer
│   │   └── events/                # EventListingPage, EventCard, etc.
│   ├── lib/
│   │   ├── prisma.ts              # Instância Prisma (singleton)
│   │   ├── schema-org.ts          # Geração JSON-LD (Event, BreadcrumbList)
│   │   ├── utils.ts               # parseEventParams (DB-aware cities)
│   │   └── constants.ts           # MAIN_CITIES, EVENT_TOPICS, CATEGORY_SLUG_MAP
│   └── middleware.ts              # Basic Auth via SITE_PROTECTION_ENABLED
├── tests/                         # Scripts Playwright (testes 1-11)
├── plano-testes-admin.md          # Plano de testes do painel admin
├── CONTEXT.md                     # Este arquivo
├── .env.local                     # Vars locais (não commitado)
└── .env.example                   # Template de variáveis
```

---

## Modelagem do Banco de Dados

### Tabelas de conteúdo

| Tabela          | Descrição                                                     |
| --------------- | ------------------------------------------------------------- |
| Event           | Eventos publicados ou em rascunho                             |
| EventSubmission | Fila de aprovação (source: organizador / agente / admin)      |
| User            | Subscribers de notificação (double opt-in)                    |
| Organizer       | Organizadores cadastrados (aprovação manual)                  |
| CityPage        | Metadados SEO por cidade (inclui cidades dinâmicas do DB)     |
| TopicPage       | Metadados SEO por tema                                        |
| CategoryPage    | Metadados SEO por categoria de evento                         |

### Event — campos principais

| Campo          | Tipo      | Notas                                                        |
| -------------- | --------- | ------------------------------------------------------------ |
| slug           | String    | Único, gerado a partir do título + cidade                    |
| title          | String    | —                                                            |
| description    | Text      | Rich text (HTML)                                             |
| start_date     | DateTime  | —                                                            |
| city / state   | String    | city="Online" para eventos online                            |
| category       | Enum      | conferencia, workshop, meetup, webinar, curso, palestra, hackathon |
| topics         | String[]  | Array de slugs de tema                                       |
| format         | Enum      | PRESENCIAL, ONLINE, HIBRIDO                                  |
| status         | Enum      | RASCUNHO, PUBLICADO, CANCELADO, ENCERRADO                    |
| source_url     | String?   | URL de origem (agente de scraping); null = cadastro manual   |
| is_free        | Boolean   | —                                                            |

---

## Enums e Constantes (src/lib/constants.ts)

### MAIN_CITIES (12 cidades estáticas)

São Paulo, Rio de Janeiro, Belo Horizonte, Curitiba, Porto Alegre, Brasília, Recife, Florianópolis, Salvador, Fortaleza, Goiânia, Campinas

> **Cidades dinâmicas**: eventos de cidades fora de MAIN_CITIES são suportados.
> Ao aprovar um evento, o sistema auto-cria um registro `CityPage` no DB.
> As páginas `/cidade/[slug]`, `/eventos/[[...params]]` e o sitemap leem CityPage do DB.

### EVENT_TOPICS (18 temas)

growth, branding, midia-paga, seo, conteudo, dados-e-analytics, crm, inteligencia-artificial, social-media, produto, email-marketing, inbound-marketing, performance, ux-e-design, ecommerce, video-e-streaming, comunidade, lideranca-em-marketing

### Categorias (7)

conferencias, workshops, meetups, webinars, cursos, palestras, hackathons

---

## Variáveis de Ambiente

```env
# Database
DATABASE_URL="postgresql://..."

# Claude API (agente de scraping)
ANTHROPIC_API_KEY="sk-ant-..."

# Proteção temporária do site (remover após lançamento)
SITE_PROTECTION_ENABLED="true"   # "false" para desativar sem remover
SITE_PROTECTION_USER="admin"
SITE_PROTECTION_PASSWORD="..."

# App
NEXT_PUBLIC_SITE_URL="https://eventosdemarketing.com.br"
NEXT_PUBLIC_SITE_NAME="Eventos de Marketing"
```

---

## Decisões Técnicas

1. **App Router + RSC por padrão**: server components, `"use client"` só para interatividade.
2. **Prisma com adapter PG**: conexão direta ao Supabase via `@prisma/adapter-pg`.
3. **Slug do evento**: gerado a partir do título + cidade. Ex: `workshop-growth-hacking-sao-paulo`.
4. **Aprovação manual**: todo evento (formulário ou scraping) passa por `/admin` antes de publicar.
5. **Cidades dinâmicas (DB-aware)**: `parseEventParams` aceita `extraCities` do DB; roteamento e sitemap leem `CityPage`.
6. **SEO-first**: JSON-LD (Event + BreadcrumbList), meta tags, sitemap dinâmico, robots.txt.
7. **Seed desativado**: catálogo populado exclusivamente via scraping e formulário (não há dados fictícios).
8. **Basic Auth temporário**: middleware intercepta todas as rotas enquanto o site não está pronto para o público.

---

## Padrões de Código

- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)
- **Componentes**: PascalCase, um por arquivo (`EventCard.tsx`)
- **Rotas API**: kebab-case (`/api/admin/events`)
- **Variáveis/funções**: camelCase
- **Tipos**: PascalCase

---

## Progresso Atual

### ✅ Concluído

- [x] **Setup** — Next.js 15, TypeScript strict, Tailwind v4, Prisma + Supabase
- [x] **Modelagem** — schema completo (Event, User, Organizer, Submission, CityPage, TopicPage, CategoryPage)
- [x] **Páginas públicas** — Home, /eventos (listagem + filtros), /evento/[slug], /cidade/[cidade], /eventos/[[...params]] (catch-all com filtros aninhados)
- [x] **SEO** — JSON-LD (Event + BreadcrumbList), meta tags programáticos, sitemap dinâmico (2143+ URLs), robots.txt
- [x] **Formulário de cadastro** — `/cadastrar-evento` com suporte a scraping via URL (agente Claude + Playwright)
- [x] **Painel admin** — `/admin` com CRUD de eventos, submissões, categorias, cidades e temas; aprovação gera CityPage automaticamente para cidades novas
- [x] **Testes admin (1-11)** — 235 checks, 0 falhas (testes Playwright em `tests/`)
- [x] **Proteção temporária** — Basic Auth (middleware), noindex/nofollow, robots Disallow:/
- [x] **Banco limpo** — dados de seed removidos; 1 evento real (SEOCamp 2026, Santos)
- [x] **Melhorias admin (6)** — filtros em Eventos e Cidades, remoção aba Aprovados, comportamento por status (RASCUNHO=404, CANCELADO/ENCERRADO=banner), contadores de eventos nas abas, bloqueio exclusão de cidades
- [x] **Automação de encerramento** — cron `/api/cron/close-events` via vercel.json (diariamente às 03:00 UTC)

### Comportamento por Status de Evento

| Status     | Página pública | Listagens | Sitemap | Home | Comportamento especial |
|------------|---------------|-----------|---------|------|------------------------|
| PUBLICADO  | ✅            | ✅        | ✅      | ✅   | Normal                 |
| RASCUNHO   | ❌ (404)      | ❌        | ❌      | ❌   | —                      |
| CANCELADO  | ✅            | ❌        | ❌      | ❌   | Banner vermelho no topo; badge no EventCard |
| ENCERRADO  | ✅            | ❌ (data passada) | ❌ | ❌ | Banner cinza no topo; auto-criado pelo cron |

### ⏳ Próximas Etapas

- [ ] **Popular o catálogo** — usar agente de scraping para importar eventos reais
- [ ] **Configurar env vars na Vercel** — `SITE_PROTECTION_ENABLED`, `SITE_PROTECTION_USER`, `SITE_PROTECTION_PASSWORD`
- [ ] **Fase 3** — Sistema de notificações por email (subscribers + newsletter)
- [ ] **Fase 4** — Autenticação real para `/admin` e `/api/admin/*` (substituir Basic Auth por JWT/session)
- [ ] **Lançamento público** — remover proteção (Basic Auth, noindex, robots Disallow)
- [ ] **Pendência futura** — notificação de interessados quando evento é cancelado ou nova edição disponível

### Avisos conhecidos

- `/admin` acessível sem autenticação real (apenas Basic Auth de site) — implementar auth na Fase 4
- meta_title de CityPages auto-criadas pode ter sufixo duplicado (cosmético, não afeta SEO)
- Tailwind v4: usar `@import "tailwindcss"` e blocos `@theme` (não as diretivas v3)
