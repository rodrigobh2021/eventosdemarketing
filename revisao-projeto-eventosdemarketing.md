# Revisão Completa — eventosdemarketing.com.br
## Data: 19/02/2026

---

## RESUMO EXECUTIVO

O projeto avançou significativamente. O site está funcional com páginas públicas otimizadas para SEO, agente de scraping com IA, formulário de cadastro, painel administrativo completo e deploy na Vercel. O site está protegido (senha + noindex) enquanto é populado com eventos reais.

---

## STATUS POR FASE

### ✅ Fase 0 — Setup e Fundação (COMPLETA)
- Domínio registrado: eventosdemarketing.com.br
- Repositório GitHub
- Next.js 16 + TypeScript + Tailwind CSS + App Router
- ESLint + Prettier configurados
- PostgreSQL via Supabase (região São Paulo)
- Prisma ORM com schema completo
- Deploy na Vercel (www como canonical)

### ✅ Fase 1 — Modelagem de Dados (COMPLETA)
- Models: Event, User, Organizer, EventSubmission
- Enums: EventCategory, EventFormat, EventStatus, SubmissionStatus, SubmissionSource
- Índices otimizados para queries de listagem
- Dados de seed removidos (banco limpo para dados reais)

### ✅ Fase 2 — Páginas Públicas Core (COMPLETA)
- **Layout**: Header (logo, busca, CTAs), Footer (4 colunas), responsivo
- **Home**: Hero, categorias, eventos em destaque, cidades, CTAs
- **Listagem com filtros**: Sidebar desktop, drawer mobile, query params
- **SEO programático**: ~2.000 URLs pré-geradas
  - /eventos/[tema] (18)
  - /eventos/[categoria] (7)
  - /eventos-marketing-[cidade] (12+)
  - Todas as combinações tema × categoria × cidade
- **Página do evento**: Layout 2 colunas, dados completos, mapa, eventos relacionados
- **Dados estruturados**: JSON-LD (Event + BreadcrumbList)
- **Adicionar ao Calendário**: Google Calendar, Outlook, .ics (com link de volta ao site)
- **Landing pages de cidade**: Hero, pills de categorias dinâmicas (só com eventos), texto SEO único, CTA notificações
- **Badge de cidade**: Internal linking na página do evento
- **SEO técnico**:
  - Sitemap dinâmico com lastmod real (sem priority/changefreq)
  - robots.txt (temporariamente Disallow: /)
  - Meta tags globais + por página
  - Open Graph + Twitter Cards
  - Canonical com www
  - max-image-preview:large, max-snippet:-1, max-video-preview:-1

### ⏳ Fase 3 — Sistema de Notificações (PENDENTE)
- Nenhum item iniciado
- Itens planejados:
  - Cadastro de email com double opt-in
  - Matching de preferências (cidade, tema, categoria)
  - Disparo de notificações para novos eventos
  - Fluxo de notificação para eventos cancelados (futuramente)
  - Fluxo para novas edições de eventos encerrados (futuramente)

### ⏳ Fase 4 — Portal do Organizador (PARCIAL)
- ✅ Formulário de cadastro unificado (scraping + manual)
- ✅ Diferenciação organizador vs. indicação
- ✅ Campo de email obrigatório para organizadores
- ⏳ Autenticação (PENDENTE)
- ⏳ Dashboard do organizador (PENDENTE)

### ✅ Fase 5 — Agente de Scraping + Admin (QUASE COMPLETA)

**Agente de Scraping:**
- ✅ Playwright (navegador headless) para extração
- ✅ Claude API (Sonnet) para interpretação
- ✅ Extração de HTML, meta tags, JSON-LD
- ✅ Descrição em HTML com formatação preservada
- ✅ Funciona com Sympla, Eventbrite, sites próprios, Framer, etc.

**Formulário de Cadastro:**
- ✅ Input de URL + extração automática
- ✅ Preenchimento manual como alternativa
- ✅ Editor rich text (Tiptap) para descrição
- ✅ Diferenciação organizador/indicação + email de contato
- ✅ Validação com Zod (client + server)
- ✅ Bloqueio de datas passadas no calendário
- ✅ URL do evento e imagem obrigatórios
- ✅ Preview antes de submeter

**Painel Administrativo:**
- ✅ Tabs: Pendentes | Rejeitados | Eventos | Categorias | Cidades | Temas
- ✅ Filtros avançados na aba Eventos (texto, status, cidade, estado, tema, categoria, formato, data)
- ✅ Filtros na aba Cidades (texto, estado)
- ✅ Aprovação com campos de SEO editáveis (slug, meta title, meta description)
- ✅ Edição completa de eventos (todos os campos, tema, categoria)
- ✅ Edição de categorias, cidades e temas (título, descrição, meta tags)
- ✅ Slug readonly em categorias, cidades e temas
- ✅ Cidade restrita a select (sem digitação livre na edição)
- ✅ UF automática pela cidade selecionada
- ✅ Contadores de eventos em cidades, categorias e temas
- ✅ Criação automática de cidade ao cadastrar evento de cidade nova
- ✅ Revisão de eventos rejeitados (aprovar ou excluir definitivamente)
- ✅ Editor rich text na edição de descrição
- ✅ Exclusão de categorias/temas bloqueada
- ✅ Exclusão de cidades bloqueada

**Status de Eventos:**
- ✅ Publicado: visível no site, no sitemap, nas listagens
- ✅ Rascunho: 404, fora do sitemap, fora das listagens
- ✅ Cancelado: página ativa com banner vermelho, sem compra/calendário, mantém "Tenho Interesse", fora do sitemap
- ✅ Encerrado: página ativa com banner cinza, sem compra/calendário, mantém "Tenho Interesse", fora do sitemap
- ✅ Encerramento automático via cron diário + ao salvar evento com data passada

**Página do Evento — Extras:**
- ✅ Tooltip explicativo no badge "Evento Verificado"
- ✅ Mapa com fallback por endereço (não depende de lat/lng)
- ✅ Descrição renderizada com HTML formatado (sanitizado)

**Pendente na Fase 5:**
- ⏳ Popular catálogo com 50-100 eventos reais

### ⏳ Fase 6 — Polimento e Lançamento (PENDENTE)
- Validar dados estruturados no Google Rich Results Test (5 páginas)
- Testes de performance (Lighthouse)
- Testes de acessibilidade
- Revisão visual final (mobile + desktop)
- Remover proteção de senha
- Reverter robots.txt e meta robots para indexação
- Submeter sitemap no Google Search Console
- Submeter sitemap no Bing Webmaster Tools

---

## PROTEÇÕES TEMPORÁRIAS ATIVAS (pré-lançamento)
- 🔒 Site protegido com Basic Auth (middleware Next.js)
- 🔒 robots.txt: Disallow: /
- 🔒 meta robots: noindex, nofollow
- Env vars: SITE_PROTECTION_ENABLED, SITE_PROTECTION_USER, SITE_PROTECTION_PASSWORD

---

## PENDÊNCIAS E DÍVIDAS TÉCNICAS

| Prioridade | Item | Fase |
|------------|------|------|
| 🔴 Alta | Trocar senha do banco Supabase (exposta no chat) | Imediata |
| 🔴 Alta | Popular catálogo com eventos reais | 5.5 |
| 🟡 Média | Autenticação no admin (/admin protegido) | 4 |
| 🟡 Média | Sistema de notificações por email | 3 |
| 🟡 Média | Dashboard do organizador | 4 |
| 🟡 Média | Campo de busca de cidades no filtro lateral (sidebar) | Melhoria |
| 🟢 Baixa | Fluxo de notificação para eventos cancelados | 3 |
| 🟢 Baixa | Fluxo de notificação para novas edições de encerrados | 3 |
| 🟢 Baixa | Sitemap index quando passar de 50k URLs | Futuro |
| 🟢 Baixa | OG Image dinâmica por evento | Futuro |

---

## PRÓXIMOS PASSOS RECOMENDADOS

### Curto prazo (próximas sessões)
1. **Trocar senha do Supabase** (5 min)
2. **Popular catálogo** — usar o agente para cadastrar 50-100 eventos reais de marketing no Brasil
3. **Campo de busca de cidades** no filtro lateral (melhoria pendente dos testes)

### Médio prazo
4. **Fase 3 — Notificações**: Cadastro de email, preferências, disparo automático
5. **Fase 4 — Autenticação**: Proteger /admin, login para organizadores
6. **Fase 6 — Lançamento**: Remover proteções, submeter ao Google

### Longo prazo
7. Dashboard do organizador
8. Fluxos de notificação avançados (cancelamento, novas edições)
9. Analytics e métricas de uso
10. OG Images dinâmicas

---

## STACK TÉCNICA FINAL

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Linguagem | TypeScript |
| Estilização | Tailwind CSS |
| Banco de dados | PostgreSQL via Supabase (São Paulo) |
| ORM | Prisma |
| Scraping | Playwright (headless Chromium) |
| IA | Anthropic Claude API (Sonnet) |
| Editor rich text | Tiptap |
| Sanitização HTML | DOMPurify |
| Validação | Zod |
| Deploy | Vercel |
| Domínio | www.eventosdemarketing.com.br |

---

## TESTES REALIZADOS

- ✅ 11 testes automatizados (Playwright) — todos passaram
- ✅ Verificação manual completa — 7 correções aplicadas
- ✅ 6 melhorias adicionais implementadas e validadas
- 📌 Pendente: validação no Google Rich Results Test (pós-lançamento)
