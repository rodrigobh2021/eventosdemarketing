# Plano de Testes — Painel Administrativo

## Instrução prévia

Antes de iniciar os testes, remover do Admin as opções de **excluir e criar novas categorias e temas**. Manter apenas a opção de **editar** as existentes, dado que já mapeiam todas as opções comuns do mercado.

---

## TESTE 1 — EXCLUSÃO DE EVENTO

**Ação**: Na aba Eventos, excluir um evento existente.

**Resultado esperado**:
1. O evento deve ser removido da listagem na aba Eventos do admin
2. O card do evento não deve mais ser exibido em nenhuma página pública:
   - Listagem geral (/eventos)
   - Página de cidade correspondente (/eventos-marketing-[cidade])
   - Páginas de categoria (/eventos/[categoria])
   - Páginas de tema (/eventos/[tema])
   - Páginas combinadas (/eventos/[tema]/[cidade], /eventos/[tema]/[categoria], etc.)
3. A página individual do evento (/evento/[slug]) deve retornar 404
4. A URL do evento não deve mais constar no sitemap (/sitemap.xml)
5. Se o evento aparecia na seção "Eventos Relacionados" de outros eventos, deve ser removido de lá também

---

## TESTE 2 — EDIÇÃO DE EVENTO

**Ação**: Na aba Eventos, editar todas as seções de um evento existente:
- SEO & URL (meta title, meta description, slug)
- Informações Básicas (título, categoria, formato, temas)
- Data e Horário (data início, data término, horário início, horário término)
- Local (nome do local, endereço, cidade, estado, latitude, longitude)
- Informações dos Ingressos (gratuito/pago, preço, link de compra)
- Descrição
- Links (URL do evento, URL da imagem)
- Organizador (nome, URL)

**Resultado esperado**:
1. As informações alteradas devem refletir imediatamente na página pública do evento (/evento/[slug])
2. Se o slug foi alterado, a URL antiga deve retornar 404 e a nova URL deve funcionar
3. Se o slug foi alterado, o sitemap deve conter a nova URL e não a antiga
4. O card do evento nas listagens deve refletir as alterações (título, data, cidade, preço)
5. Os dados estruturados (JSON-LD) na página do evento devem refletir as alterações
6. Se a cidade foi alterada, o evento deve aparecer na listagem da nova cidade e não da antiga
7. Se a categoria foi alterada, o evento deve aparecer na listagem da nova categoria
8. O arquivo .ics gerado pelo "Adicionar ao Calendário" deve conter as informações atualizadas

---

## TESTE 3 — EDIÇÃO DE CATEGORIA

**Ação**: Na aba Categorias, editar as informações de uma categoria:
- Título da página
- Slug
- Descrição
- Meta title
- Meta description

**Resultado esperado**:
1. A página pública da categoria (/eventos/[slug-da-categoria]) deve refletir o novo título, descrição e meta tags
2. Se o slug foi alterado, a URL antiga deve retornar 404 e a nova deve funcionar
3. O sitemap deve conter o novo slug e não o antigo
4. Os cards de categoria na home e nas listagens devem refletir o novo título
5. Os filtros de categoria na sidebar devem refletir o novo título e linkar para o novo slug

---

## TESTE 4 — EDIÇÃO DE CIDADE

**Ação**: Na aba Cidades, editar as informações de uma cidade:
- Cidade
- UF
- Título da página
- Slug
- Descrição
- Meta title
- Meta description

**Resultado esperado**:
1. A landing page da cidade (/eventos-marketing-[slug]) deve refletir as alterações no título, descrição, texto SEO e meta tags
2. Se o slug foi alterado, a URL antiga (/eventos-marketing-[slug-antigo]) deve retornar 404 e a nova deve funcionar
3. O sitemap deve conter o novo slug em todas as combinações:
   - /eventos-marketing-[novo-slug]
   - /eventos/[tema]/[novo-slug]
   - /eventos/[categoria]/[novo-slug]
   - /eventos/[tema]/[categoria]/[novo-slug]
4. Os cards de cidade na home ("Explore por Cidade") devem refletir o novo nome
5. Os filtros de cidade na sidebar devem refletir o novo nome e linkar para o novo slug
6. O badge "Ver mais eventos em [Cidade]" nas páginas de eventos dessa cidade deve refletir o novo nome

---

## TESTE 5 — EDIÇÃO DE TEMA

**Ação**: Na aba Temas, editar as informações de um tema:
- Título da página
- Slug
- Descrição
- Meta title
- Meta description

**Resultado esperado**:
1. A página pública do tema (/eventos/[slug-do-tema]) deve refletir o novo título, descrição e meta tags
2. Se o slug foi alterado, a URL antiga deve retornar 404 e a nova deve funcionar
3. O sitemap deve conter o novo slug em todas as combinações:
   - /eventos/[novo-slug]
   - /eventos/[novo-slug]/[cidade]
   - /eventos/[novo-slug]/[categoria]
   - /eventos/[novo-slug]/[categoria]/[cidade]
4. Os pills de tema na home e nas listagens devem refletir o novo título e linkar para o novo slug
5. As tags de tema na página individual dos eventos devem refletir o novo título

---

## TESTE 6 — CRIAÇÃO DE NOVA CIDADE + EVENTO MANUAL

**Ação**: Simular a criação de um evento em uma cidade que não existe na base.

**Passo a passo**:
1. Acessar /cadastrar-evento
2. Selecionar "Prefiro preencher manualmente"
3. Selecionar "Não, estou indicando este evento"
4. Preencher as informações:
   - Título: "Meetup de Marketing Digital Contagem"
   - Categoria: Meetup
   - Formato: Presencial
   - Temas: growth, social-media
   - Data de início: uma data futura (ex: 2026-04-15)
   - Horário: 19:00 às 22:00
   - Local: "Espaço Coworking Contagem"
   - Endereço: "Rua Fictícia, 123 - Centro"
   - Cidade: selecionar "Outra Cidade" e digitar "Contagem"
   - Estado: MG
   - Evento gratuito: Sim
   - Descrição: texto com no mínimo 100 caracteres sobre o meetup
   - URL do evento: https://exemplo.com/meetup-contagem
   - URL da imagem: uma URL de imagem válida
   - Organizador: "Comunidade Marketing Contagem"
5. Submeter o evento
6. Acessar /admin e aprovar o evento

**Resultado esperado**:
1. O novo evento deve aparecer na aba Eventos do admin
2. A nova cidade "Contagem" deve aparecer na aba Cidades do admin, com todas as informações preenchidas automaticamente (título da página, slug, descrição, meta title, meta description)
3. O evento deve estar publicado e acessível em /evento/meetup-de-marketing-digital-contagem (ou slug gerado)
4. A página do evento deve ter dados estruturados (JSON-LD) corretos e completos
5. A landing page da cidade deve estar criada e acessível em /eventos-marketing-contagem
6. As páginas combinadas devem funcionar:
   - /eventos/growth/contagem
   - /eventos/social-media/contagem
   - /eventos/meetups/contagem
   - /eventos/growth/meetups/contagem
   - /eventos/social-media/meetups/contagem
7. Todas as novas URLs devem constar no sitemap
8. O card do evento deve aparecer nas listagens filtradas correspondentes
9. O evento NÃO deve ter selo de verificado (foi cadastrado como indicação)

---

## TESTE 7 — CRIAÇÃO DE NOVA CIDADE + EVENTO VIA SCRAPING

**Ação**: Criar um evento a partir do link de um evento real, em uma cidade que não existe na base.

**Passo a passo**:
1. Acessar /cadastrar-evento
2. Colar a URL: https://www.sympla.com.br/evento/da-invisibilidade-ao-lucro-marketing-estrategico-para-empreendedores/3306507
3. Clicar em "Extrair Informações"
4. Aguardar a extração automática
5. Validar os dados pré-preenchidos no formulário — o agente deve ter extraído:
   - Título do evento (ex: "Da Invisibilidade ao Lucro: Marketing Estratégico para Empreendedores" ou similar)
   - Categoria provável: Curso ou Workshop ou Palestra
   - Formato: Presencial
   - Temas prováveis: growth, inbound-marketing ou equivalentes
   - Data e horário do evento
   - Cidade: Iguatu (se o agente extraiu) — se não, preencher manualmente
   - Estado: CE
   - Local e endereço (se disponível na página)
   - Informação de preço
   - Link de compra (URL do Sympla)
   - Imagem/banner do evento
   - Nome do organizador
6. Corrigir ou completar informações que o agente não conseguiu extrair:
   - Garantir que a cidade está como "Iguatu" e estado como "CE"
   - Se a cidade não apareceu, selecionar "Outra Cidade" e digitar "Iguatu"
   - Completar campos faltantes (endereço, horário, etc.)
7. Selecionar "Não, estou indicando este evento" (já que não somos o organizador)
8. Submeter o evento
9. Acessar /admin e aprovar o evento

**Resultado esperado**:
1. A extração automática deve ter preenchido a maioria dos campos do formulário (mínimo: título, data, categoria, descrição, link de compra)
2. O campo source_url deve estar preenchido com a URL do Sympla
3. Na aba Pendentes do admin, a submissão deve aparecer com badge "Agente"
4. Após aprovação, o evento deve estar publicado e acessível em sua página individual
5. A nova cidade "Iguatu" deve aparecer na aba Cidades do admin com informações geradas automaticamente
6. A landing page de Iguatu deve estar acessível em /eventos-marketing-iguatu
7. As páginas combinadas devem funcionar (ex: /eventos/growth/iguatu, /eventos/cursos/iguatu, etc.)
8. Todas as novas URLs devem constar no sitemap
9. Os dados estruturados (JSON-LD) devem estar corretos, incluindo dados de preço e link de compra
10. O evento NÃO deve ter selo de verificado (cadastrado como indicação)
11. A source_url original do Sympla deve estar registrada no evento

---

## TESTES ADICIONAIS RECOMENDADOS

### TESTE 8 — CONSISTÊNCIA DA HOME PAGE

**Ação**: Após todos os testes anteriores, verificar a home page.

**Resultado esperado**:
1. A seção "Próximos Eventos" deve exibir apenas eventos publicados com data futura
2. O evento excluído no Teste 1 não deve aparecer
3. Os eventos editados devem refletir as novas informações nos cards
4. As novas cidades (Contagem, Iguatu) devem aparecer na seção "Explore por Cidade" se tiverem eventos
5. Nenhum link quebrado nos cards de eventos ou cidades

### TESTE 9 — INTEGRIDADE DO SITEMAP

**Ação**: Acessar /sitemap.xml após todos os testes.

**Resultado esperado**:
1. Nenhuma URL de evento excluído presente
2. URLs com slugs antigos (editados) não presentes
3. Novas URLs (Contagem, Iguatu, novos eventos) presentes
4. Todos os lastmod com datas coerentes
5. Nenhuma URL duplicada
6. Todas as URLs retornam 200 (não 404)

### TESTE 10 — DADOS ESTRUTURADOS (JSON-LD)

**Ação**: Em 3 páginas de eventos (um original, um editado e um novo), verificar os dados estruturados.

**Resultado esperado**:
1. Cada página tem script type="application/ld+json" no HTML
2. O JSON contém @type: "Event" com todos os campos obrigatórios
3. Datas no formato ISO 8601
4. Location correto (Place para presencial, VirtualLocation para online)
5. Offers com preço e URL de compra corretos
6. BreadcrumbList presente e com URLs corretas

### TESTE 11 — PROTEÇÃO DO ADMIN

**Ação**: Verificar que rotas sensíveis não estão acessíveis publicamente de forma indevida.

**Resultado esperado**:
1. /admin exibe o badge "Sem autenticação" como lembrete
2. As API routes de admin (/api/admin/*) estão acessíveis (por enquanto, sem auth)
3. Registrar como pendência para a Fase 4: proteger /admin e /api/admin/* com autenticação
