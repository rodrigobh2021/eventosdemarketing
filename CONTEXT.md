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
| Framework          | Next.js 16 (App Router) | com React 19, Turbopack           |
| Linguagem          | TypeScript              | 5+ (strict mode)                  |
| Estilização        | Tailwind CSS            | v4 (`@import "tailwindcss"`)      |
| Banco de dados     | PostgreSQL              | via Supabase (região São Paulo)   |
| ORM                | Prisma                  | com adapter `@prisma/adapter-pg`  |
| Agente de scraping | Claude API + Playwright | claude-sonnet-4-6                 |
| Editor rich text   | Tiptap                  | —                                 |
| Sanitização HTML   | DOMPurify               | —                                 |
| Validação          | Zod                     | client + server                   |
| Calendário (.ics)  | ical-generator          | —                                 |
| Deploy             | Vercel                  | —                                 |
| Domínio            | www.eventosdemarketing.com.br | canonical com www            |

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
│   │   │   ├── cron/close-events/ # Encerramento automático (cron diário)
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
| description    | Text      | Rich text (HTML sanitizado com DOMPurify)                    |
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

## Progresso Atual (19/02/2026)

### ✅ Fase 0 — Setup e Fundação (COMPLETA)
- [x] Domínio registrado: eventosdemarketing.com.br
- [x] Repositório GitHub
- [x] Next.js 16 + TypeScript + Tailwind CSS v4 + App Router
- [x] ESLint + Prettier configurados
- [x] PostgreSQL via Supabase (região São Paulo)
- [x] Prisma ORM com schema completo
- [x] Deploy na Vercel (www como canonical)

### ✅ Fase 1 — Modelagem de Dados (COMPLETA)
- [x] Models: Event, User, Organizer, EventSubmission, CityPage, TopicPage, CategoryPage
- [x] Enums: EventCategory, EventFormat, EventStatus, SubmissionStatus, SubmissionSource
- [x] Índices otimizados para queries de listagem
- [x] Dados de seed removidos (banco limpo para dados reais)

### ✅ Fase 2 — Páginas Públicas Core (COMPLETA)
- [x] Layout: Header (logo, busca, CTAs), Footer (4 colunas), responsivo
- [x] Home: Hero, categorias, eventos em destaque, cidades, CTAs
- [x] Listagem com filtros: Sidebar desktop, drawer mobile, query params
- [x] SEO programático: ~2.000 URLs pré-geradas (`/eventos/[tema]`, `/eventos/[categoria]`, `/eventos-marketing-[cidade]` e combinações)
- [x] Página do evento: Layout 2 colunas, dados completos, mapa, eventos relacionados
- [x] Dados estruturados: JSON-LD (Event + BreadcrumbList)
- [x] Adicionar ao Calendário: Google Calendar, Outlook, .ics (com link de volta ao site)
- [x] Landing pages de cidade: Hero, pills de categorias dinâmicas (filtradas por disponibilidade), texto SEO único, CTA notificações
- [x] Badge de cidade: Internal linking na página do evento
- [x] Tooltip explicativo no badge "Evento Verificado"
- [x] SEO técnico: Sitemap dinâmico com lastmod real, robots.txt, meta tags, OG, canonical, max-image-preview

### ⏳ Fase 3 — Sistema de Notificações (PENDENTE)
- [ ] Cadastro de email com double opt-in
- [ ] Matching de preferências (cidade, tema, categoria)
- [ ] Disparo de notificações para novos eventos
- [ ] Fluxo de notificação para eventos cancelados (futuro)
- [ ] Fluxo para novas edições de eventos encerrados (futuro)

### ⏳ Fase 4 — Proteção do Admin (PENDENTE)
- [ ] Autenticação no /admin (PENDENTE)

> Dashboard do organizador removido da V1. Será implementado em versão futura,
> quando houver plano de monetização e mídia kit.

### ✅ Fase 5 — Agente de Scraping + Admin (QUASE COMPLETA)

**Agente de Scraping:**
- [x] Playwright (navegador headless) para extração
- [x] Claude API (Sonnet) para interpretação
- [x] Extração de HTML, meta tags, JSON-LD
- [x] Descrição em HTML com formatação preservada
- [x] Funciona com Sympla, Eventbrite, sites próprios, Framer, etc.

**Formulário de Cadastro:**
- [x] Input de URL + extração automática
- [x] Preenchimento manual como alternativa
- [x] Editor rich text (Tiptap) para descrição
- [x] Diferenciação organizador/indicação + email de contato
- [x] Validação com Zod (client + server)
- [x] Bloqueio de datas passadas no calendário
- [x] URL do evento e imagem obrigatórios
- [x] Preview antes de submeter

**Painel Administrativo:**
- [x] Tabs: Pendentes | Rejeitados | Eventos | Categorias | Cidades | Temas
- [x] Filtros avançados na aba Eventos (texto, status, cidade, estado, tema, categoria, formato, data)
- [x] Filtros na aba Cidades (texto, estado)
- [x] Aprovação com campos de SEO editáveis (slug, meta title, meta description)
- [x] Edição completa de eventos (todos os campos, tema, categoria)
- [x] Edição de categorias, cidades e temas (título, descrição, meta tags)
- [x] Slug readonly em categorias, cidades e temas
- [x] Cidade restrita a select (sem digitação livre na edição)
- [x] UF automática pela cidade selecionada
- [x] Contadores de eventos em cidades, categorias e temas
- [x] Criação automática de cidade ao cadastrar evento de cidade nova
- [x] Revisão de eventos rejeitados (aprovar ou excluir definitivamente)
- [x] Editor rich text (Tiptap) na edição de descrição
- [x] Exclusão de categorias, temas e cidades bloqueada

**Status de Eventos:**
- [x] Automação de encerramento: cron `/api/cron/close-events` via `vercel.json` (diariamente às 03:00 UTC)

**Pendente na Fase 5:**
- [ ] Popular catálogo com 50-100 eventos reais

### ⏳ Fase 6 — Polimento e Lançamento (PENDENTE)
- [ ] Validar dados estruturados no Google Rich Results Test (5 páginas)
- [ ] Testes de performance (Lighthouse)
- [ ] Testes de acessibilidade
- [ ] Revisão visual final (mobile + desktop)
- [ ] Remover proteção de senha (Basic Auth)
- [ ] Reverter robots.txt e meta robots para indexação
- [ ] Submeter sitemap no Google Search Console
- [ ] Submeter sitemap no Bing Webmaster Tools

---

## Comportamento por Status de Evento

| Status     | Página pública | Listagens | Sitemap | Home | Comportamento especial |
|------------|---------------|-----------|---------|------|------------------------|
| PUBLICADO  | ✅            | ✅        | ✅      | ✅   | Normal                 |
| RASCUNHO   | ❌ (404)      | ❌        | ❌      | ❌   | —                      |
| CANCELADO  | ✅            | ❌        | ❌      | ❌   | Banner vermelho; sem compra/calendário; mantém "Tenho Interesse" |
| ENCERRADO  | ✅            | ❌ (data passada) | ❌ | ❌ | Banner cinza; sem compra/calendário; mantém "Tenho Interesse" |

---

## Proteções Temporárias Ativas (pré-lançamento)

- 🔒 Site protegido com Basic Auth (middleware Next.js)
- 🔒 `robots.txt`: `Disallow: /`
- 🔒 `meta robots`: `noindex, nofollow`
- Env vars: `SITE_PROTECTION_ENABLED`, `SITE_PROTECTION_USER`, `SITE_PROTECTION_PASSWORD`

---

## Pendências e Dívidas Técnicas

| Prioridade | Item                                                              | Fase      |
|------------|-------------------------------------------------------------------|-----------|
| 🔴 Alta    | Trocar senha do banco Supabase (exposta no chat)                  | Imediata  |
| 🔴 Alta    | Popular catálogo com eventos reais (50-100 eventos)               | 5.5       |
| 🟡 Média   | Autenticação no admin (/admin protegido)                          | 4         |
| 🟡 Média   | Sistema de notificações por email                                 | 3         |
| 🟡 Média   | Campo de busca de cidades no filtro lateral (sidebar)             | Melhoria  |
| 🟢 Baixa   | Fluxo de notificação para eventos cancelados                      | 3         |
| 🟢 Baixa   | Fluxo de notificação para novas edições de encerrados             | 3         |
| 🟢 Baixa   | Sitemap index quando passar de 50k URLs                           | Futuro    |
| 🟢 Baixa   | OG Image dinâmica por evento                                      | Futuro    |

---

## Próximos Passos Recomendados

### Curto prazo
1. **Trocar senha do Supabase** (5 min)
2. **Popular catálogo** — usar o agente para cadastrar 50-100 eventos reais de marketing no Brasil
3. **Campo de busca de cidades** no filtro lateral (melhoria pendente dos testes)

### Médio prazo
4. **Fase 3 — Notificações**: Cadastro de email, preferências, disparo automático
5. **Fase 4 — Autenticação**: Proteger /admin
6. **Fase 6 — Lançamento**: Remover proteções, submeter ao Google

### Longo prazo
7. Dashboard do organizador (versão futura, pós-monetização)
8. Fluxos de notificação avançados (cancelamento, novas edições)
9. Analytics e métricas de uso
10. OG Images dinâmicas

---

## Testes Realizados

- ✅ 11 testes automatizados (Playwright, `tests/`) — todos passaram
- ✅ Verificação manual completa — 7 correções aplicadas
- ✅ 6 melhorias adicionais implementadas e validadas
- 📌 Pendente: validação no Google Rich Results Test (pós-lançamento)

---

## Avisos Conhecidos

- `/admin` acessível sem autenticação real (apenas Basic Auth de site) — implementar auth na Fase 4
- `meta_title` de CityPages auto-criadas pode ter sufixo duplicado (cosmético, não afeta SEO)
- Tailwind v4: usar `@import "tailwindcss"` e blocos `@theme` (não as diretivas v3)
- Datas armazenadas como UTC midnight: usar `getUTCDate/Month/FullYear()` para evitar bug de timezone (UTC-3)
