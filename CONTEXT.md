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

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js (App Router) | 14+ |
| Linguagem | TypeScript | 5+ |
| Estilização | Tailwind CSS | 3+ |
| Banco de dados | PostgreSQL | via Supabase ou Neon |
| ORM | Prisma | latest |
| Autenticação | NextAuth.js (Auth.js) | v5 |
| Email | Resend | latest |
| Mapas | Google Maps Embed API | — |
| Calendário (.ics) | ical-generator | latest |
| Agente de scraping | Claude API + Playwright | — |
| Deploy | Vercel | — |

---

## Estrutura de Pastas (Esperada)

```
eventosdemarketing/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Layout raiz
│   │   ├── page.tsx                    # Home
│   │   ├── eventos/
│   │   │   ├── page.tsx               # Listagem com filtros
│   │   │   └── [slug]/
│   │   │       └── page.tsx           # Página do evento
│   │   ├── eventos-marketing-[cidade]/
│   │   │   └── page.tsx               # Landing pages por cidade
│   │   ├── alertas/
│   │   │   └── page.tsx               # Cadastro de notificações
│   │   ├── para-organizadores/
│   │   │   └── page.tsx               # Landing do organizador
│   │   ├── organizador/
│   │   │   ├── cadastro/
│   │   │   │   └── page.tsx           # Cadastro de organizador
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx           # Dashboard do organizador
│   │   │   └── novo-evento/
│   │   │       └── page.tsx           # Formulário de submissão
│   │   ├── admin/
│   │   │   └── page.tsx               # Painel administrativo
│   │   ├── politica-de-privacidade/
│   │   │   └── page.tsx
│   │   ├── termos-de-uso/
│   │   │   └── page.tsx
│   │   └── api/
│   │       ├── events/
│   │       │   ├── route.ts           # CRUD de eventos
│   │       │   ├── [slug]/
│   │       │   │   ├── route.ts
│   │       │   │   └── calendar.ics/
│   │       │   │       └── route.ts   # Geração de .ics
│   │       │   └── search/
│   │       │       └── route.ts       # Busca e filtros
│   │       ├── subscribers/
│   │       │   └── route.ts           # Cadastro de notificações
│   │       ├── organizers/
│   │       │   └── route.ts           # CRUD de organizadores
│   │       ├── submissions/
│   │       │   └── route.ts           # Submissões de eventos
│   │       ├── agent/
│   │       │   └── scrape/
│   │       │       └── route.ts       # Endpoint do agente
│   │       ├── newsletter/
│   │       │   └── route.ts           # Disparo de newsletter
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts
│   │       └── sitemap.xml/
│   │           └── route.ts           # Sitemap dinâmico
│   ├── components/
│   │   ├── ui/                        # Componentes base (Button, Input, Modal, etc.)
│   │   ├── layout/                    # Header, Footer, Sidebar
│   │   ├── events/                    # EventCard, EventList, EventFilters, EventMap
│   │   ├── forms/                     # SubscribeForm, EventSubmissionForm
│   │   └── shared/                    # CalendarButton, ShareButton, Badge, etc.
│   ├── lib/
│   │   ├── prisma.ts                  # Instância do Prisma client
│   │   ├── auth.ts                    # Configuração NextAuth
│   │   ├── email.ts                   # Configuração Resend
│   │   ├── calendar.ts               # Geração de arquivos .ics
│   │   ├── scraper.ts                # Lógica do agente de scraping
│   │   ├── schema-org.ts             # Geração de JSON-LD
│   │   ├── utils.ts                   # Utilitários gerais
│   │   └── constants.ts              # Categorias, temas, cidades
│   ├── types/
│   │   └── index.ts                   # Types e interfaces TypeScript
│   └── styles/
│       └── globals.css                # Estilos globais e Tailwind imports
├── scripts/
│   └── agent.ts                       # CLI do agente de scraping
├── public/
│   ├── favicon.ico
│   ├── og-image.png                   # Open Graph image padrão
│   └── robots.txt
├── CONTEXT.md                         # Este arquivo
├── .env.local                         # Variáveis de ambiente (não commitar)
├── .env.example                       # Template de variáveis
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Modelagem do Banco de Dados

### Event
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK, auto-generated |
| slug | String | Único, gerado a partir do título + cidade |
| title | String | Obrigatório |
| description | Text | Rich text (HTML) |
| start_date | DateTime | Obrigatório |
| end_date | DateTime? | Opcional |
| start_time | String? | "09:00" |
| end_time | String? | "18:00" |
| city | String | Obrigatório |
| state | String | UF (2 chars) |
| address | String? | Endereço completo |
| latitude | Float? | Para mapa |
| longitude | Float? | Para mapa |
| venue_name | String? | Nome do local |
| category | Enum | conferencia, workshop, meetup, webinar, curso, palestra, hackathon |
| topics | String[] | Array: growth, branding, midia-paga, seo, conteudo, dados, crm, ia, social-media, produto |
| is_free | Boolean | Default false |
| price_info | String? | Texto livre: "a partir de R$97" |
| ticket_url | String? | Link para compra |
| event_url | String? | Site oficial do evento |
| image_url | String? | Banner/capa |
| organizer_name | String | Obrigatório |
| organizer_url | String? | Site do organizador |
| format | Enum | presencial, online, hibrido |
| status | Enum | rascunho, publicado, cancelado, encerrado |
| is_verified | Boolean | Default false |
| source_url | String? | URL de onde o agente extraiu |
| interest_count | Int | Default 0 |
| created_at | DateTime | Auto |
| updated_at | DateTime | Auto |

### User (subscriber)
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| email | String | Único, obrigatório |
| name | String? | |
| cities_of_interest | String[] | Array de cidades |
| topics_of_interest | String[] | Array de temas |
| notify_free_only | Boolean | Default false |
| email_verified | Boolean | Default false |
| verification_token | String? | Para double opt-in |
| unsubscribe_token | String | Único, para link de descadastro |
| created_at | DateTime | Auto |

### Organizer
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| name | String | Obrigatório |
| email | String | Único |
| company | String? | |
| website | String? | |
| logo_url | String? | |
| is_approved | Boolean | Default false |
| auth_provider | String? | google, email |
| created_at | DateTime | Auto |

### EventSubmission
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| organizer_id | UUID? | FK → Organizer (null se via agente) |
| event_data | JSON | Dados do evento antes de aprovação |
| status | Enum | pendente, aprovado, rejeitado |
| reviewer_notes | String? | |
| source | Enum | organizador, agente, admin |
| reviewed_at | DateTime? | |
| created_at | DateTime | Auto |

---

## Enums e Constantes

### Categorias de evento
```typescript
enum EventCategory {
  CONFERENCIA = "conferencia",
  WORKSHOP = "workshop",
  MEETUP = "meetup",
  WEBINAR = "webinar",
  CURSO = "curso",
  PALESTRA = "palestra",
  HACKATHON = "hackathon",
}
```

### Temas / Tópicos
```typescript
const EVENT_TOPICS = [
  "growth",
  "branding",
  "midia-paga",
  "seo",
  "conteudo",
  "dados-e-analytics",
  "crm",
  "inteligencia-artificial",
  "social-media",
  "produto",
  "email-marketing",
  "inbound-marketing",
  "performance",
  "ux-e-design",
  "ecommerce",
  "video-e-streaming",
  "comunidade",
  "lideranca-em-marketing",
] as const;
```

### Formatos
```typescript
enum EventFormat {
  PRESENCIAL = "presencial",
  ONLINE = "online",
  HIBRIDO = "hibrido",
}
```

### Cidades principais (para filtros e landing pages)
```typescript
const MAIN_CITIES = [
  { slug: "sao-paulo", name: "São Paulo", state: "SP" },
  { slug: "rio-de-janeiro", name: "Rio de Janeiro", state: "RJ" },
  { slug: "belo-horizonte", name: "Belo Horizonte", state: "MG" },
  { slug: "curitiba", name: "Curitiba", state: "PR" },
  { slug: "porto-alegre", name: "Porto Alegre", state: "RS" },
  { slug: "brasilia", name: "Brasília", state: "DF" },
  { slug: "recife", name: "Recife", state: "PE" },
  { slug: "florianopolis", name: "Florianópolis", state: "SC" },
  { slug: "salvador", name: "Salvador", state: "BA" },
  { slug: "fortaleza", name: "Fortaleza", state: "CE" },
  { slug: "goiania", name: "Goiânia", state: "GO" },
  { slug: "campinas", name: "Campinas", state: "SP" },
] as const;
```

---

## Funcionalidades por Fase

### ✅ v1 (MVP)
- [x] Página do evento completa com dados estruturados (JSON-LD)
- [x] Adicionar ao calendário (Google Calendar, Outlook, .ics)
- [x] Listagem com filtros (cidade, tema, categoria, formato, gratuito, data)
- [x] Cadastro de notificações por email (com double opt-in e LGPD)
- [x] Portal do organizador (cadastro de eventos com aprovação)
- [x] Agente de scraping (Claude API + Playwright)
- [x] Landing pages por cidade (SEO local)
- [x] Newsletter semanal automática
- [x] Open Graph + Twitter Cards otimizados
- [x] Sitemap dinâmico + robots.txt
- [x] Botão "Tenho Interesse" com contador
- [x] Badge "Evento Verificado"
- [x] Compartilhamento social (WhatsApp, LinkedIn, Twitter, copiar link)
- [x] Painel admin para aprovação de eventos

### ⏳ v2 (futuro)
- [ ] Login para usuário final (favoritos, histórico)
- [ ] Sistema de avaliações/reviews pós-evento
- [ ] Blog com conteúdo sobre marketing
- [ ] App mobile (PWA primeiro)
- [ ] Integração com CRM para organizadores
- [ ] Recomendação inteligente de eventos
- [ ] Destaque pago para eventos (monetização)
- [ ] API pública

---

## Decisões Técnicas

1. **App Router (não Pages Router)**: Usar o App Router do Next.js para server components, melhor SEO e streaming.
2. **Server Components por padrão**: Componentes são server por padrão. Usar `"use client"` apenas quando necessário (interatividade, hooks).
3. **Prisma como ORM**: Type-safe, migrations automáticas, bom ecossistema.
4. **Resend para emails**: API simples, bom suporte a React Email para templates.
5. **Sem login para usuário final na v1**: O cadastro de notificações funciona apenas com email + preferências. Reduz fricção.
6. **Aprovação manual de eventos**: Todo evento submetido (por organizador ou agente) passa por aprovação antes de ser publicado. Garante qualidade.
7. **Slug do evento**: Gerado automaticamente a partir do título + cidade. Ex: `workshop-growth-hacking-sao-paulo`.
8. **Imagens**: Usar `next/image` com otimização automática. Banners de evento armazenados no Supabase Storage ou Cloudflare R2.
9. **Idioma**: Todo o site em português (pt-BR). Sem internacionalização na v1.
10. **SEO-first**: Todas as páginas devem ter meta tags, Open Graph, JSON-LD e URLs amigáveis desde o início.

---

## Variáveis de Ambiente (.env.example)

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Resend (email)
RESEND_API_KEY="..."
EMAIL_FROM="noreply@eventosdemarketing.com.br"

# Google Maps
GOOGLE_MAPS_API_KEY="..."

# Claude API (para agente de scraping)
ANTHROPIC_API_KEY="..."

# App
NEXT_PUBLIC_SITE_URL="https://eventosdemarketing.com.br"
NEXT_PUBLIC_SITE_NAME="Eventos de Marketing"
```

---

## Padrões de Código

- **Componentes**: PascalCase, um componente por arquivo. Ex: `EventCard.tsx`
- **Rotas API**: kebab-case. Ex: `/api/events/search`
- **Variáveis e funções**: camelCase
- **Tipos/Interfaces**: PascalCase, prefixo com `I` apenas se necessário para distinção
- **Arquivos**: kebab-case para utilitários, PascalCase para componentes
- **Commits**: Conventional Commits (feat:, fix:, chore:, docs:)
- **Formulários**: Validação com Zod (shared entre client e server)
- **Error handling**: try/catch em API routes, Error Boundaries em componentes
- **Loading states**: Skeleton components (não spinners genéricos)

---

## Progresso Atual

> Atualize esta seção conforme avança no projeto.

- [ ] **Fase 0** — Setup e Fundação
- [ ] **Fase 1** — Modelagem de Dados
- [ ] **Fase 2** — Páginas Públicas Core
- [ ] **Fase 3** — Sistema de Notificações
- [ ] **Fase 4** — Portal do Organizador
- [ ] **Fase 5** — Agente de Scraping
- [ ] **Fase 6** — Polimento e Lançamento
