# Plano de Projeto — eventosdemarketing.com.br

---

## 1. Análise da Proposta

### A proposta de valor está clara?

Sim, o core está bem definido: **ser o hub centralizado para profissionais de marketing descobrirem eventos da área**. Isso resolve uma dor real — hoje essa informação está fragmentada entre LinkedIn, Instagram, newsletters, sites de ingressos e grupos de WhatsApp. Ter um lugar único, filtrável e com notificações é valioso.

Porém, recomendo que você afile a comunicação da proposta de valor para o usuário final. Não basta ser "um site de eventos de marketing". O diferencial precisa ficar claro na primeira dobra do site. Sugestão de posicionamento:

> **"Nunca mais perca um evento de marketing. Descubra conferências, workshops e meetups da sua cidade — filtrados por tema, data e preço."**

### O que está bom no escopo da v1

- **Adicionar ao calendário** → Essencial. Reduz fricção e aumenta a chance do usuário realmente ir ao evento.
- **Página completa do evento com dados estruturados** → Fundamental para SEO. Eventos com schema markup (`Event`, `Place`, `Offer`) aparecem em rich results do Google. Isso pode ser seu principal canal de aquisição orgânica.
- **Filtros robustos** → É o que transforma o site de uma lista em uma ferramenta útil.
- **Notificações por email** → Excelente para retenção e para construir uma base de contatos.
- **Cadastro por organizadores** → Resolve o lado da oferta do marketplace.
- **Agente de scraping** → Inteligente. Reduz a barreira para o organizador e permite que você também alimente o catálogo proativamente.

### O que eu adicionaria na v1

1. **Newsletter semanal automática**: Além da notificação pontual, uma newsletter semanal tipo "Eventos de Marketing desta semana em [cidade]" gera hábito e mantém o site na mente do usuário. Pode ser gerada automaticamente a partir dos eventos cadastrados.

2. **Compartilhamento social otimizado**: Open Graph tags bem feitas para que, ao compartilhar um evento, a preview no LinkedIn/WhatsApp/Twitter fique bonita e informativa. Isso é marketing gratuito.

3. **Página de cidade**: Páginas como `/eventos-marketing-sao-paulo`, `/eventos-marketing-rio-de-janeiro`. Isso é ouro para SEO local e cria landing pages naturais.

4. **Indicador de "evento verificado"**: Para diferenciar eventos cadastrados por organizadores (verificados) de eventos adicionados pelo agente ou por terceiros. Gera confiança.

5. **Botão "Tenho interesse" / contador**: Mesmo sem login, um contador de "X pessoas interessadas" gera prova social e pode ser usado para priorizar eventos na listagem.

6. **Sitemap dinâmico e robots.txt otimizado**: Fundamental desde o dia 1 para indexação.

### O que considerar além do código

| Aspecto                             | Detalhes                                                                                                                                                       |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Domínio e hosting**               | Registrar eventosdemarketing.com.br. Considerar Vercel, Cloudflare Pages ou um VPS para deploy.                                                                |
| **LGPD**                            | Coleta de email para notificações exige consentimento explícito, política de privacidade e opção de descadastro fácil. Obrigatório desde o dia 1.              |
| **Termos de uso**                   | Especialmente para organizadores que cadastram eventos. Quem é responsável pela veracidade?                                                                    |
| **Curadoria vs. plataforma aberta** | Definir se qualquer evento entra ou se há um processo de aprovação. Recomendo aprovação manual no início para garantir qualidade.                              |
| **Cold start**                      | O site precisa ter eventos antes de ter usuários. Planeje alimentar o catálogo com pelo menos 50-100 eventos antes do lançamento, usando o agente de scraping. |
| **Fonte de eventos para o agente**  | Mapear de onde o agente vai coletar: Sympla, Eventbrite, Even3, Meetup, sites de empresas organizadoras, LinkedIn Events.                                      |
| **Modelo de receita futuro**        | Ainda não precisa monetizar, mas pense desde já: destaque pago para eventos? Leads qualificados para organizadores? Mídia?                                     |
| **Monitoramento e analytics**       | Google Analytics 4, Google Search Console e Plausible/Umami para métricas de uso desde o lançamento.                                                           |

---

## 2. Stack Tecnológica Recomendada

Para um projeto que prioriza SEO, performance e velocidade de desenvolvimento com Claude Code:

| Camada                 | Tecnologia                                   | Justificativa                                                |
| ---------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| **Framework**          | Next.js 14+ (App Router)                     | SSR/SSG para SEO, API routes integradas, excelente DX        |
| **Linguagem**          | TypeScript                                   | Segurança de tipos, melhor experiência com Claude Code       |
| **Estilização**        | Tailwind CSS                                 | Rápido para prototipar, responsivo, fácil de iterar          |
| **Banco de dados**     | PostgreSQL (via Supabase ou Neon)            | Robusto, suporte a full-text search em PT-BR, geolocalização |
| **ORM**                | Prisma ou Drizzle                            | Type-safe, migrations automáticas                            |
| **Autenticação**       | NextAuth.js (Auth.js)                        | Login social (Google), magic link por email                  |
| **Email**              | Resend ou SendGrid                           | Notificações e newsletter                                    |
| **Mapas**              | Google Maps Embed ou Leaflet + OpenStreetMap | Para a página do evento                                      |
| **Calendário (.ics)**  | ical-generator (npm)                         | Gera arquivos .ics compatíveis com todos os calendários      |
| **Agente de scraping** | Claude API + Playwright/Puppeteer            | Navega, extrai e estrutura dados de sites de eventos         |
| **Deploy**             | Vercel                                       | Deploy automático, edge functions, analytics integrado       |
| **CMS para eventos**   | Admin custom ou Payload CMS                  | Para gerenciar aprovações de eventos                         |

---

## 3. Passo a Passo do Projeto

### FASE 0 — Setup e Fundação (Dias 1-3)

**Objetivo**: Ter o projeto configurado e rodando localmente.

```
□ 0.1  Registrar domínio eventosdemarketing.com.br
□ 0.2  Criar repositório Git (GitHub)
□ 0.3  Inicializar projeto Next.js com TypeScript e Tailwind
       → npx create-next-app@latest --typescript --tailwind --app
□ 0.4  Configurar ESLint e Prettier
□ 0.5  Configurar banco PostgreSQL (Supabase ou Neon)
□ 0.6  Instalar e configurar Prisma/Drizzle
□ 0.7  Criar schema inicial do banco de dados (ver Fase 1)
□ 0.8  Configurar variáveis de ambiente (.env.local)
□ 0.9  Primeiro deploy na Vercel (mesmo que vazio)
□ 0.10 Conectar domínio à Vercel
```

### FASE 1 — Modelagem de Dados (Dias 3-5)

**Objetivo**: Ter o banco de dados modelado e com migrations prontas.

**Entidades principais**:

```
□ 1.1  Modelar tabela Event:
       - id, slug, title, description (rich text)
       - start_date, end_date, start_time, end_time
       - city, state, address, latitude, longitude
       - venue_name
       - category (enum: conferencia, workshop, meetup, webinar, curso, palestra, hackathon)
       - topics[] (array: growth, branding, midia-paga, seo, conteudo, dados, crm, ia, social-media, produto, etc.)
       - is_free (boolean)
       - price_info (texto livre: "a partir de R$97")
       - ticket_url
       - event_url (site oficial)
       - image_url (banner/capa)
       - organizer_name
       - organizer_url
       - format (enum: presencial, online, hibrido)
       - status (enum: rascunho, publicado, cancelado, encerrado)
       - is_verified (boolean)
       - source_url (de onde o agente extraiu)
       - created_at, updated_at

□ 1.2  Modelar tabela User:
       - id, email, name
       - cities_of_interest[]
       - topics_of_interest[]
       - notify_free_only (boolean)
       - email_verified (boolean)
       - created_at

□ 1.3  Modelar tabela Organizer:
       - id, name, email, company
       - website, logo_url
       - is_approved (boolean)
       - created_at

□ 1.4  Modelar tabela EventSubmission:
       - id, organizer_id, event_data (JSON)
       - status (enum: pendente, aprovado, rejeitado)
       - reviewed_at, reviewer_notes
       - created_at

□ 1.5  Rodar migrations e seed inicial com dados de teste
```

### FASE 2 — Páginas Públicas Core (Dias 5-15)

**Objetivo**: Ter as páginas que o usuário final vai acessar.

```
□ 2.1  LAYOUT BASE
       - Header com logo, navegação e busca
       - Footer com links, redes sociais e LGPD
       - Mobile-first, responsivo
       - Fonte e identidade visual (definir paleta de cores)

□ 2.2  HOME PAGE (/)
       - Hero com proposta de valor e campo de busca
       - Eventos em destaque (próximos 7 dias)
       - Filtros rápidos por cidade
       - CTA para cadastro de notificações
       - CTA para organizadores

□ 2.3  PÁGINA DE LISTAGEM/FILTRO (/eventos)
       - Grid de cards de eventos
       - Filtros na sidebar (desktop) ou drawer (mobile):
         · Cidade / Estado
         · Categoria (conferência, workshop, etc.)
         · Temas/tópicos
         · Formato (presencial, online, híbrido)
         · Gratuito / Pago
         · Data (hoje, esta semana, este mês, range customizado)
       - Ordenação: data, relevância
       - Paginação ou infinite scroll
       - URL com query params (para compartilhamento e SEO)
         → /eventos?cidade=sao-paulo&tema=seo&gratuito=true
       - Resultados: "X eventos encontrados"

□ 2.4  PÁGINA DO EVENTO (/eventos/[slug])
       - Banner/imagem do evento
       - Título, data, horário, local
       - Descrição completa (com formatação)
       - Mapa interativo do local (Google Maps embed)
       - Botão "Comprar Ingresso" (link externo)
       - Botão "Adicionar ao Calendário" (dropdown: Google, Outlook, iCal)
       - Informações do organizador
       - Badge "Evento Verificado" (se aplicável)
       - Botão "Tenho Interesse" com contador
       - Compartilhar (WhatsApp, LinkedIn, Twitter, copiar link)
       - Eventos relacionados (mesmo tema ou cidade)

□ 2.5  DADOS ESTRUTURADOS (Schema.org)
       - Implementar JSON-LD na página do evento:
         · @type: Event
         · name, description, startDate, endDate
         · location (@type: Place ou VirtualLocation)
         · offers (@type: Offer, price, availability, url)
         · organizer (@type: Organization)
         · image, eventStatus, eventAttendanceMode
       - Testar com Google Rich Results Test

□ 2.6  FUNCIONALIDADE "ADICIONAR AO CALENDÁRIO"
       - Instalar ical-generator
       - Endpoint /api/events/[slug]/calendar.ics
       - Gerar arquivo .ics com:
         · VEVENT com DTSTART, DTEND, SUMMARY, DESCRIPTION
         · LOCATION com endereço completo
         · URL do evento
         · VALARM (lembrete 1 dia antes)
       - Link Google Calendar (URL scheme):
         → https://calendar.google.com/calendar/render?action=TEMPLATE&...
       - Link Outlook Web (URL scheme)
       - Download .ics para Apple Calendar e outros

□ 2.7  PÁGINAS DE CIDADE (/eventos-marketing-[cidade])
       - Landing page por cidade
       - Lista de eventos naquela cidade
       - Texto introdutório (bom para SEO)
       - Meta tags otimizadas para busca local

□ 2.8  SEO TÉCNICO
       - Sitemap.xml dinâmico (atualizado com novos eventos)
       - robots.txt
       - Meta tags (title, description, og:image) por página
       - Open Graph e Twitter Cards
       - Canonical URLs
       - Breadcrumbs com schema markup
```

### FASE 3 — Sistema de Notificações (Dias 15-20)

**Objetivo**: Permitir que usuários se cadastrem para receber alertas.

```
□ 3.1  FORMULÁRIO DE CADASTRO
       - Modal ou página /alertas
       - Campos: email, nome, cidades de interesse, temas de interesse
       - Opção "apenas eventos gratuitos"
       - Consentimento LGPD explícito (checkbox obrigatório)
       - Double opt-in (email de confirmação)

□ 3.2  SISTEMA DE EMAIL
       - Configurar Resend ou SendGrid
       - Templates de email (HTML responsivo):
         · Email de confirmação de cadastro
         · Notificação de novo evento
         · Newsletter semanal (opcional, mas recomendado)
         · Email de boas-vindas
       - Criar domínio de envio verificado (noreply@eventosdemarketing.com.br)

□ 3.3  LÓGICA DE MATCHING E DISPARO
       - Ao publicar um evento, buscar usuários cujas preferências façam match
       - Disparar email de notificação (assíncrono, via queue ou cron)
       - Respeitar frequência (não mais que 1 email/dia, agrupar se necessário)
       - Link de descadastro em todos os emails

□ 3.4  NEWSLETTER SEMANAL (recomendado para v1)
       - Cron job semanal (segunda-feira de manhã)
       - Selecionar eventos da semana por cidade/tema do usuário
       - Gerar email personalizado
       - Disparar via Resend/SendGrid
```

### FASE 4 — Portal do Organizador (Dias 20-27)

**Objetivo**: Permitir que organizadores cadastrem eventos.

```
□ 4.1  AUTENTICAÇÃO DE ORGANIZADOR
       - Página de cadastro (/para-organizadores)
       - Login via email (magic link) ou Google
       - Perfil do organizador (nome, empresa, logo)
       - Status de aprovação

□ 4.2  FORMULÁRIO DE SUBMISSÃO DE EVENTO
       - Formulário multi-step:
         Step 1: Informações básicas (título, data, local)
         Step 2: Detalhes (descrição, temas, preço)
         Step 3: Links e imagem (ingresso, site, banner)
         Step 4: Revisão e envio
       - Upload de imagem (banner do evento)
       - Preview da página do evento antes de enviar
       - Validações client e server-side

□ 4.3  DASHBOARD DO ORGANIZADOR (/organizador/dashboard)
       - Lista de eventos submetidos
       - Status de cada submissão (pendente, aprovado, rejeitado)
       - Editar evento (se aprovado, gera nova revisão)
       - Métricas básicas (visualizações, cliques no ingresso, "interessados")

□ 4.4  PAINEL DE ADMINISTRAÇÃO (/admin)
       - Lista de submissões pendentes
       - Aprovar / Rejeitar com comentários
       - Editar qualquer evento
       - Gerenciar organizadores
       - Ver métricas gerais
```

### FASE 5 — Agente de Scraping (Dias 27-35)

**Objetivo**: Agente que extrai dados de sites de eventos automaticamente.

```
□ 5.1  ARQUITETURA DO AGENTE
       - Input: URL do site do evento
       - Processo:
         1. Playwright navega até a URL
         2. Extrai HTML da página
         3. Claude API recebe o HTML + prompt estruturado
         4. Claude retorna JSON com dados do evento
         5. Dados são validados e salvos como EventSubmission
       - Output: Evento em rascunho, aguardando aprovação

□ 5.2  PROMPT DO AGENTE (engenharia de prompt)
       - Prompt system com as instruções de extração
       - Definir exatamente os campos esperados
       - Lidar com dados ausentes (marcar como "não encontrado")
       - Extrair: título, data, horário, local, descrição, preço,
         link de ingresso, organizador, formato, temas
       - Normalizar datas para ISO 8601
       - Inferir categoria e temas a partir da descrição

□ 5.3  INTERFACE DO AGENTE
       Opção A: CLI tool para uso interno
       - Rodar: node agent.js "https://evento.com.br"
       - Exibe resultado no terminal
       - Confirma e salva no banco

       Opção B: Interface web no admin
       - Campo de URL no painel admin
       - Botão "Extrair dados"
       - Preview dos dados extraídos
       - Edição manual antes de salvar
       - Publicação direta ou envio para revisão

□ 5.4  FONTES DE DADOS MAPEADAS
       - Sympla (eventos de marketing)
       - Eventbrite Brasil
       - Even3
       - Meetup.com
       - LinkedIn Events (via scraping ou API)
       - Sites de organizadores conhecidos (RD Station, Resultados Digitais, etc.)

□ 5.5  POPULAÇAO INICIAL DO CATÁLOGO
       - Usar o agente para cadastrar 50-100 eventos iniciais
       - Revisar e aprovar manualmente
       - Garantir cobertura das principais capitais
```

### FASE 6 — Polimento e Lançamento (Dias 35-42)

**Objetivo**: Qualidade, performance e ir ao ar.

```
□ 6.1  TESTES
       - Testes unitários para funções críticas (matching, geração de .ics)
       - Testes E2E para fluxos principais (Playwright):
         · Buscar evento → ver detalhes → adicionar ao calendário
         · Cadastrar para notificações
         · Organizador submeter evento
       - Testar em mobile (Chrome, Safari)

□ 6.2  PERFORMANCE
       - Lighthouse score > 90 em todas as páginas
       - Otimização de imagens (next/image, WebP, lazy loading)
       - Cache estático para páginas de evento (ISR/revalidate)
       - Core Web Vitals no verde

□ 6.3  LGPD E LEGAL
       - Página de Política de Privacidade
       - Página de Termos de Uso
       - Banner de cookies (se usar analytics)
       - Consentimento explícito em todos os formulários
       - Opção de exclusão de dados

□ 6.4  ANALYTICS
       - Google Analytics 4
       - Google Search Console (submeter sitemap)
       - Eventos customizados:
         · Clique em "comprar ingresso"
         · Clique em "adicionar ao calendário"
         · Cadastro de notificação
         · Uso de filtros
       - Rastreamento de UTMs

□ 6.5  LAUNCH CHECKLIST
       - [ ] Todos os links funcionam
       - [ ] Favicon e ícones PWA
       - [ ] 404 page customizada
       - [ ] Emails transacionais testados (confirmação, notificação)
       - [ ] Open Graph tags testadas (usar ogimage.dev ou similar)
       - [ ] Schema markup validado (Google Rich Results Test)
       - [ ] Sitemap acessível
       - [ ] SSL certificado ativo
       - [ ] Backup do banco configurado
       - [ ] Monitoramento de uptime (UptimeRobot)
       - [ ] Catálogo com pelo menos 50 eventos reais
```

---

## 4. Priorização e o que NÃO fazer na v1

### Não coloque na v1 (deixe para v2+):

- **Login para usuário final** (notificação funciona só com email, sem necessidade de conta)
- **App mobile nativo** (o site responsivo é suficiente)
- **Sistema de reviews/avaliações de eventos**
- **Marketplace de ingressos** (apenas redirecione para o site do organizador)
- **Chat ou comunidade**
- **Integração com CRM para organizadores**
- **Versão em inglês**
- **Sistema de recomendação por ML** (comece com filtros simples)

---

## 5. Cronograma Resumido

| Fase                   | Duração        | Entregável                            |
| ---------------------- | -------------- | ------------------------------------- |
| 0 — Setup              | 3 dias         | Projeto rodando local + deploy vazio  |
| 1 — Banco de dados     | 2 dias         | Schema completo com migrations        |
| 2 — Páginas públicas   | 10 dias        | Home, listagem, página do evento, SEO |
| 3 — Notificações       | 5 dias         | Cadastro, emails, matching            |
| 4 — Portal organizador | 7 dias         | Formulário, dashboard, admin          |
| 5 — Agente scraping    | 8 dias         | Extração automática funcionando       |
| 6 — Polimento          | 7 dias         | Testes, performance, LGPD, launch     |
| **Total**              | **~6 semanas** | **Site no ar com catálogo inicial**   |

---

## 6. Dicas para Trabalhar com Claude Code

1. **Comece cada fase descrevendo o contexto completo**: Antes de pedir para o Claude Code criar algo, explique o projeto, a stack e o que já foi feito.

2. **Peça um arquivo por vez para coisas complexas**: Em vez de "crie todo o sistema de notificações", peça "crie o schema Prisma para a tabela User com campos X, Y, Z".

3. **Use o Claude Code para gerar e você para revisar**: Deixe ele gerar componentes, API routes e queries, mas sempre revise o código antes de commitar.

4. **Mantenha um arquivo CONTEXT.md na raiz**: Com a descrição do projeto, stack, decisões tomadas e próximos passos. Cole o conteúdo relevante no início de cada sessão.

5. **Peça testes junto com o código**: "Crie o componente EventCard e um teste para ele".

6. **Itere rápido**: Monte a estrutura primeiro (layouts, rotas, schema) e depois preencha com conteúdo e lógica.

---

## 7. Riscos e Mitigações

| Risco                          | Impacto                      | Mitigação                                                                                     |
| ------------------------------ | ---------------------------- | --------------------------------------------------------------------------------------------- |
| Catálogo vazio no lançamento   | Usuários não voltam          | Usar agente para popular 50-100 eventos antes de lançar                                       |
| Scraping bloqueado por sites   | Não consegue extrair eventos | Ter múltiplas fontes; fallback para cadastro manual                                           |
| Baixo tráfego orgânico inicial | Pouca visibilidade           | SEO técnico desde o dia 1; páginas de cidade; conteúdo de blog                                |
| Organizadores não usam         | Poucos eventos novos         | Outreach ativo; facilitar ao máximo o cadastro; agente de scraping supre gap                  |
| LGPD não cumprida              | Risco legal                  | Implementar consentimento e política desde o primeiro formulário                              |
| Eventos desatualizados         | Perda de credibilidade       | Cron que marca eventos passados como "encerrado"; alerta para revisar eventos sem atualização |
