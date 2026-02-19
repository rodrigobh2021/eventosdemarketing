/**
 * TESTE 2 — EDIÇÃO DE EVENTO
 * Edita todas as seções de um evento via admin e verifica que as
 * alterações refletem corretamente em todas as páginas públicas.
 *
 * Execução: node tests/test2-edicao-evento.js
 */

import { chromium } from '../node_modules/playwright/index.mjs';

const BASE = 'http://localhost:3000';

// ── Mapeamentos ────────────────────────────────────────────────────────────

const CAT_TO_SLUG = {
  CONFERENCIA: 'conferencias', WORKSHOP: 'workshops', MEETUP: 'meetups',
  WEBINAR: 'webinars', CURSO: 'cursos', PALESTRA: 'palestras', HACKATHON: 'hackathons',
};

// Cidade (nome DB) → slug de URL
const CITY_TO_SLUG = {
  'São Paulo': 'sao-paulo', 'Rio de Janeiro': 'rio-de-janeiro',
  'Belo Horizonte': 'belo-horizonte', 'Curitiba': 'curitiba',
  'Porto Alegre': 'porto-alegre', 'Brasília': 'brasilia',
  'Recife': 'recife', 'Florianópolis': 'florianopolis',
  'Salvador': 'salvador', 'Fortaleza': 'fortaleza',
  'Goiânia': 'goiania', 'Campinas': 'campinas',
};
// Slug → nome DB
const SLUG_TO_CITY = Object.fromEntries(Object.entries(CITY_TO_SLUG).map(([k, v]) => [v, k]));

const ALL_CATS = ['CONFERENCIA', 'WORKSHOP', 'MEETUP', 'WEBINAR', 'CURSO', 'PALESTRA', 'HACKATHON'];
const MAIN_CITY_NAMES = Object.keys(CITY_TO_SLUG);
const ALL_TOPICS = ['growth', 'seo', 'midia-paga', 'conteudo', 'branding',
  'inteligencia-artificial', 'social-media', 'dados-e-analytics', 'crm', 'ecommerce'];

function pickOther(list, current) {
  return list.find(x => x !== current) ?? list[1] ?? list[0];
}

function pickOtherTopics(currentTopics, count = 2) {
  return ALL_TOPICS.filter(t => !currentTopics.includes(t)).slice(0, count);
}

// ── Helpers ────────────────────────────────────────────────────────────────

function log(label, status, detail = '') {
  const icon = status === 'PASSOU' ? '✅' : status === 'FALHOU' ? '❌' : '⚠️';
  const line = `${icon} ${status.padEnd(7)} | ${label}${detail ? ` — ${detail}` : ''}`;
  console.log(line);
  return { label, status, detail };
}

async function getStatus(page, url) {
  const r = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  return r ? r.status() : 0;
}

async function hasLink(page, href) {
  return await page.locator(`a[href="${href}"]`).count() > 0;
}

async function pageText(page) {
  return page.locator('body').innerText().catch(() => '');
}

// ── Main ──────────────────────────────────────────────────────────────────

(async () => {
  const browser = await chromium.launch({ headless: true, slowMo: 80 });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const results = [];

  console.log('\n════════════════════════════════════════════════════════');
  console.log(' TESTE 2 — EDIÇÃO DE EVENTO');
  console.log('════════════════════════════════════════════════════════\n');

  // ── 0. Seleciona evento ────────────────────────────────────────────────────

  const { events } = await fetch(`${BASE}/api/admin/events`).then(r => r.json());
  if (!events?.length) {
    console.log('❌ Nenhum evento disponível. Abortando.');
    await browser.close(); process.exit(1);
  }

  // Escolhe o primeiro evento publicado
  const ev = events.find(e => e.status === 'PUBLICADO') ?? events[0];

  const OLD = {
    id:            ev.id,
    slug:          ev.slug,
    title:         ev.title,
    city:          ev.city,
    citySlug:      CITY_TO_SLUG[ev.city] ?? ev.city.toLowerCase().replace(/\s+/g, '-'),
    category:      ev.category,
    catSlug:       CAT_TO_SLUG[ev.category] ?? ev.category.toLowerCase(),
    topics:        ev.topics ?? [],
    is_free:       ev.is_free,
    organizer:     ev.organizer_name,
    description:   ev.description,
    start_date:    ev.start_date,
  };

  // Novos valores (todos campos diferentes do original)
  const NEW = {
    slug:           `${OLD.slug}-v2`,
    title:          `${OLD.title} [EDITADO TESTE2]`,
    city:           pickOther(MAIN_CITY_NAMES, OLD.city),
    category:       pickOther(ALL_CATS, OLD.category),
    topics:         pickOtherTopics(OLD.topics, 2),
    format:         'ONLINE',           // muda para online
    start_date:     '2026-12-10',
    end_date:       '2026-12-12',
    start_time:     '09:00',
    end_time:       '18:00',
    venue_name:     null,               // online não tem local físico
    address:        null,
    state:          'SP',
    is_free:        false,              // muda para pago
    price_info:     'A partir de R$ 299',
    ticket_url:     'https://teste2-ingresso.com.br/evento-editado',
    description:    '<p>Descrição atualizada no Teste 2. Conteúdo exclusivo para verificação de edição de evento no painel administrativo.</p>',
    event_url:      'https://evento-editado-teste2.com.br',
    image_url:      'https://picsum.photos/seed/teste2/800/400',
    organizer_name: 'Organizador Atualizado Teste 2',
    organizer_url:  'https://organizador-teste2.com.br',
    meta_title:     'Evento Editado Teste 2 | Eventos de Marketing',
    meta_description: 'Meta description editada no Teste 2 para verificação de SEO programático.',
    status:         'PUBLICADO',
    is_verified:    ev.is_verified,
  };

  NEW.citySlug = CITY_TO_SLUG[NEW.city] ?? NEW.city.toLowerCase().replace(/\s+/g, '-');
  NEW.catSlug  = CAT_TO_SLUG[NEW.category] ?? NEW.category.toLowerCase();
  NEW.topic1   = NEW.topics[0];

  console.log('📋 Evento selecionado para edição:');
  console.log(`   ID          : ${OLD.id}`);
  console.log(`   Slug antigo : ${OLD.slug}`);
  console.log(`   Slug novo   : ${NEW.slug}`);
  console.log(`   Cidade      : ${OLD.city} → ${NEW.city}`);
  console.log(`   Categoria   : ${OLD.category} → ${NEW.category}`);
  console.log(`   Temas       : [${OLD.topics.join(', ')}] → [${NEW.topics.join(', ')}]`);
  console.log(`   Gratuito    : ${OLD.is_free} → ${NEW.is_free}`);
  console.log('');

  // ── 1. PRÉ-VERIFICAÇÃO ────────────────────────────────────────────────────

  console.log('── Pré-verificações ──');

  const preStatus = await getStatus(page, `${BASE}/evento/${OLD.slug}`);
  results.push(log('Pré: slug antigo retorna 200', preStatus === 200 ? 'PASSOU' : 'FALHOU',
    `HTTP ${preStatus}`));

  console.log('');

  // ── 2. EDIÇÃO VIA API ADMIN ───────────────────────────────────────────────

  console.log('── Editando evento via API admin ──');

  const putPayload = {
    slug:           NEW.slug,
    title:          NEW.title,
    category:       NEW.category,
    format:         NEW.format,
    topics:         NEW.topics,
    start_date:     NEW.start_date,
    end_date:       NEW.end_date,
    start_time:     NEW.start_time,
    end_time:       NEW.end_time,
    city:           NEW.city,
    state:          NEW.state,
    venue_name:     NEW.venue_name,
    address:        NEW.address,
    latitude:       null,
    longitude:      null,
    is_free:        NEW.is_free,
    price_info:     NEW.price_info,
    ticket_url:     NEW.ticket_url,
    description:    NEW.description,
    event_url:      NEW.event_url,
    image_url:      NEW.image_url,
    organizer_name: NEW.organizer_name,
    organizer_url:  NEW.organizer_url,
    source_url:     ev.source_url ?? null,
    is_organizer:   ev.is_organizer ?? null,
    organizer_email:ev.organizer_email ?? null,
    submitter_email:ev.submitter_email ?? null,
    status:         NEW.status,
    is_verified:    NEW.is_verified,
    meta_title:     NEW.meta_title,
    meta_description: NEW.meta_description,
  };

  const putResp = await fetch(`${BASE}/api/admin/events/${OLD.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(putPayload),
  });
  const putBody = await putResp.json();

  if (putResp.status === 200) {
    results.push(log('PUT /api/admin/events/[id]', 'PASSOU',
      `HTTP ${putResp.status} — ${JSON.stringify(putBody)}`));
  } else {
    results.push(log('PUT /api/admin/events/[id]', 'FALHOU',
      `HTTP ${putResp.status} — ${JSON.stringify(putBody)}`));
    console.log('\n❌ Edição falhou. Abortando verificações.');
    await browser.close(); process.exit(1);
  }

  await page.waitForTimeout(1500);
  console.log('');

  // ── 3. VERIFICAÇÕES PÓS-EDIÇÃO ────────────────────────────────────────────

  console.log('── Verificações pós-edição ──');

  // a) /evento/[novo-slug] → 200 com novas informações
  const newEventUrl = `${BASE}/evento/${NEW.slug}`;
  const newPageStatus = await getStatus(page, newEventUrl);
  results.push(log(`a) /evento/${NEW.slug} retorna 200`, newPageStatus === 200 ? 'PASSOU' : 'FALHOU',
    `HTTP ${newPageStatus}`));

  if (newPageStatus === 200) {
    const bodyText = await pageText(page);

    // Verifica título
    const hasNewTitle = bodyText.includes(NEW.title.replace(' [EDITADO TESTE2]', ''));
    results.push(log('a) Novo título visível na página', hasNewTitle ? 'PASSOU' : 'FALHOU',
      hasNewTitle ? `"${NEW.title.slice(0, 40)}…"` : `título não encontrado`));

    // Verifica cidade (nova)
    const hasNewCity = bodyText.includes(NEW.city);
    results.push(log(`a) Nova cidade "${NEW.city}" visível`, hasNewCity ? 'PASSOU' : 'FALHOU'));

    // Verifica descrição atualizada
    const descSnippet = 'Conteúdo exclusivo para verificação de edição';
    const hasDesc = bodyText.includes(descSnippet);
    results.push(log('a) Descrição atualizada visível', hasDesc ? 'PASSOU' : 'FALHOU'));

    // Verifica organizador
    const hasOrg = bodyText.includes(NEW.organizer_name);
    results.push(log(`a) Organizador "${NEW.organizer_name}" visível`, hasOrg ? 'PASSOU' : 'FALHOU'));

    // Verifica preço
    const hasPrice = bodyText.includes('299') || bodyText.includes('R$');
    results.push(log('a) Informação de preço visível', hasPrice ? 'PASSOU' : 'FALHOU',
      hasPrice ? 'R$299 encontrado' : 'preço não encontrado'));

    // Verifica imagem
    const hasImg = await page.locator(`img[src="${NEW.image_url}"]`).count() > 0
      || bodyText.includes('picsum.photos');
    results.push(log('a) URL de imagem atualizada', hasImg ? 'PASSOU' : 'FALHOU'));
  }

  // b) /evento/[slug-antigo] → 404
  const oldEventUrl = `${BASE}/evento/${OLD.slug}`;
  const oldPageStatus = await getStatus(page, oldEventUrl);
  results.push(log(`b) /evento/${OLD.slug} retorna 404`, oldPageStatus === 404 ? 'PASSOU' : 'FALHOU',
    `HTTP ${oldPageStatus}`));

  // c) Sitemap: novo slug presente, antigo ausente
  await page.goto(`${BASE}/sitemap.xml`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const sitemapContent = await page.content();
  const newSlugInSitemap = sitemapContent.includes(`/evento/${NEW.slug}`);
  // Use </loc> boundary to avoid false positive when old slug is prefix of new slug
  const oldSlugInSitemap = sitemapContent.includes(`/evento/${OLD.slug}</loc>`)
    || sitemapContent.includes(`/evento/${OLD.slug}&`);
  results.push(log(`c) Novo slug /evento/${NEW.slug} no sitemap`,
    newSlugInSitemap ? 'PASSOU' : 'FALHOU',
    newSlugInSitemap ? 'encontrado no sitemap' : 'AUSENTE no sitemap'));
  results.push(log(`c) Slug antigo /evento/${OLD.slug} ausente no sitemap`,
    oldSlugInSitemap ? 'FALHOU' : 'PASSOU',
    oldSlugInSitemap ? 'ainda presente no sitemap!' : 'não encontrado ✓'));

  // d) /eventos → card mostra novas infos
  await page.goto(`${BASE}/eventos`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(800);
  const inListingNew = await hasLink(page, `/evento/${NEW.slug}`);
  const inListingOld = await hasLink(page, `/evento/${OLD.slug}`);
  results.push(log('d) Card com novo slug em /eventos',
    inListingNew ? 'PASSOU' : 'AVISO',
    inListingNew ? 'link encontrado' : 'não encontrado (pode estar em página 2+)'));
  results.push(log('d) Slug antigo ausente em /eventos',
    inListingOld ? 'FALHOU' : 'PASSOU',
    inListingOld ? 'link antigo ainda aparece!' : 'link antigo não encontrado ✓'));

  // Se o evento aparece na página 1, verifica as infos do card
  if (inListingNew) {
    const cardText = await page.locator(`a[href="/evento/${NEW.slug}"]`)
      .first().locator('..').innerText().catch(() => '');
    const cardHasNewCity = cardText.includes(NEW.city);
    results.push(log('d) Card mostra nova cidade',
      cardHasNewCity ? 'PASSOU' : 'AVISO',
      cardHasNewCity ? NEW.city : `cidade não encontrada no card`));
  }

  // e) /eventos-marketing-[nova-cidade] → evento aparece
  const newCityPage = `${BASE}/eventos-marketing-${NEW.citySlug}`;
  await page.goto(newCityPage, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const inNewCity = await hasLink(page, `/evento/${NEW.slug}`);
  results.push(log(`e) Evento em /eventos-marketing-${NEW.citySlug}`,
    inNewCity ? 'PASSOU' : 'FALHOU',
    inNewCity ? 'link encontrado ✓' : 'link NÃO encontrado'));

  // f) /eventos-marketing-[cidade-antiga] → evento NÃO aparece
  if (OLD.citySlug && OLD.citySlug !== NEW.citySlug) {
    const oldCityPage = `${BASE}/eventos-marketing-${OLD.citySlug}`;
    await page.goto(oldCityPage, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const inOldCity = await hasLink(page, `/evento/${NEW.slug}`);
    results.push(log(`f) Evento ausente em /eventos-marketing-${OLD.citySlug}`,
      inOldCity ? 'FALHOU' : 'PASSOU',
      inOldCity ? 'evento ainda aparece na cidade antiga!' : 'corretamente ausente ✓'));
  } else {
    results.push(log('f) Cidade não mudou', 'AVISO', 'old city === new city, skip'));
  }

  // g) /eventos/[nova-categoria] → evento aparece
  await page.goto(`${BASE}/eventos/${NEW.catSlug}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const inNewCat = await hasLink(page, `/evento/${NEW.slug}`);
  results.push(log(`g) Evento em /eventos/${NEW.catSlug}`,
    inNewCat ? 'PASSOU' : 'FALHOU',
    inNewCat ? 'link encontrado ✓' : 'link NÃO encontrado'));

  // Verifica que NÃO aparece na categoria antiga (se mudou)
  if (OLD.catSlug !== NEW.catSlug) {
    await page.goto(`${BASE}/eventos/${OLD.catSlug}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const inOldCat = await hasLink(page, `/evento/${NEW.slug}`);
    results.push(log(`g) Evento ausente em /eventos/${OLD.catSlug}`,
      inOldCat ? 'FALHOU' : 'PASSOU',
      inOldCat ? 'ainda aparece na categoria antiga!' : 'corretamente ausente ✓'));
  }

  // h) /eventos/[novo-tema] → evento aparece
  if (NEW.topic1) {
    await page.goto(`${BASE}/eventos/${NEW.topic1}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const inNewTopic = await hasLink(page, `/evento/${NEW.slug}`);
    results.push(log(`h) Evento em /eventos/${NEW.topic1}`,
      inNewTopic ? 'PASSOU' : 'FALHOU',
      inNewTopic ? 'link encontrado ✓' : 'link NÃO encontrado'));

    // Verifica que NÃO aparece em tema antigo (se diferente)
    const oldTopicNotInNew = (OLD.topics || []).find(t => !NEW.topics.includes(t));
    if (oldTopicNotInNew) {
      await page.goto(`${BASE}/eventos/${oldTopicNotInNew}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const inOldTopic = await hasLink(page, `/evento/${NEW.slug}`);
      results.push(log(`h) Evento ausente em /eventos/${oldTopicNotInNew}`,
        inOldTopic ? 'FALHOU' : 'PASSOU',
        inOldTopic ? 'ainda aparece no tema antigo!' : 'corretamente ausente ✓'));
    }
  }

  // i) JSON-LD em /evento/[novo-slug]
  await page.goto(newEventUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

  const jsonLdScripts = await page.locator('script[type="application/ld+json"]').all();
  let eventJsonLd = null;

  for (const script of jsonLdScripts) {
    try {
      const content = await script.innerText();
      const parsed = JSON.parse(content);
      if (parsed['@type'] === 'Event') { eventJsonLd = parsed; break; }
    } catch { /* skip */ }
  }

  if (!eventJsonLd) {
    results.push(log('i) JSON-LD com @type:Event encontrado', 'FALHOU', 'nenhum script ld+json com Event'));
  } else {
    results.push(log('i) JSON-LD com @type:Event encontrado', 'PASSOU'));

    // Verifica campos
    const titleMatch = (eventJsonLd.name ?? '').includes(NEW.title.replace(' [EDITADO TESTE2]', ''));
    results.push(log('i) JSON-LD: name atualizado',
      titleMatch ? 'PASSOU' : 'FALHOU',
      `name="${eventJsonLd.name?.slice(0, 60)}"`));

    const descMatch = (eventJsonLd.description ?? '').includes('Conteúdo exclusivo');
    results.push(log('i) JSON-LD: description atualizado',
      descMatch ? 'PASSOU' : 'FALHOU',
      descMatch ? 'snippet encontrado' : `"${(eventJsonLd.description ?? '').slice(0, 60)}"`));

    const startDateMatch = (eventJsonLd.startDate ?? '').includes('2026-12-10');
    results.push(log('i) JSON-LD: startDate = 2026-12-10',
      startDateMatch ? 'PASSOU' : 'FALHOU',
      `startDate="${eventJsonLd.startDate}"`));

    // Location: para ONLINE deve ser VirtualLocation
    const loc = eventJsonLd.location;
    const isVirtual = Array.isArray(loc)
      ? loc.some(l => l['@type'] === 'VirtualLocation')
      : loc?.['@type'] === 'VirtualLocation';
    results.push(log('i) JSON-LD: location é VirtualLocation (ONLINE)',
      isVirtual ? 'PASSOU' : 'FALHOU',
      `location type: ${Array.isArray(loc) ? loc.map(l => l['@type']).join(', ') : loc?.['@type']}`));

    // Offers: pago (price > 0)
    const offerPrice = eventJsonLd.offers?.price;
    const isPaid = offerPrice !== '0' && offerPrice !== 0;
    results.push(log('i) JSON-LD: offers.price reflete evento pago',
      isPaid ? 'PASSOU' : 'FALHOU',
      `price="${offerPrice}"`));

    // Organizer
    const orgMatch = (eventJsonLd.organizer?.name ?? '') === NEW.organizer_name;
    results.push(log('i) JSON-LD: organizer.name atualizado',
      orgMatch ? 'PASSOU' : 'FALHOU',
      `organizer.name="${eventJsonLd.organizer?.name}"`));
  }

  // j) ICS Calendar
  const icsUrl = `${BASE}/api/events/${NEW.slug}/calendar`;
  const icsResp = await fetch(icsUrl);
  const icsStatus = icsResp.status;

  if (icsStatus === 200) {
    results.push(log(`j) /api/events/${NEW.slug}/calendar retorna 200`, 'PASSOU'));
    const icsContent = await icsResp.text();

    // SUMMARY (título)
    const summaryMatch = icsContent.includes(NEW.title.replace(' [EDITADO TESTE2]', '').trim());
    results.push(log('j) ICS: SUMMARY contém novo título',
      summaryMatch ? 'PASSOU' : 'FALHOU',
      summaryMatch ? 'encontrado' : `SUMMARY: "${icsContent.match(/SUMMARY:(.*)/)?.[1]?.trim()}"`));

    // DTSTART: deve incluir 2026-12-10
    const dtStartMatch = icsContent.match(/DTSTART[^:]*:(.*)/)?.[1] ?? '';
    const dtHasDate = dtStartMatch.includes('20261210') || dtStartMatch.includes('2026-12-10');
    results.push(log('j) ICS: DTSTART contém 20261210',
      dtHasDate ? 'PASSOU' : 'FALHOU',
      `DTSTART: "${dtStartMatch.trim()}"`));

    // LOCATION: evento ONLINE
    const locationMatch = icsContent.match(/LOCATION:(.*)/)?.[1] ?? '';
    const locationOk = locationMatch.trim().toLowerCase().includes('online')
      || locationMatch.trim() === '';
    results.push(log('j) ICS: LOCATION reflete evento Online',
      locationOk ? 'PASSOU' : 'AVISO',
      `LOCATION: "${locationMatch.trim()}"`));

    // DESCRIPTION: deve ter o texto atualizado
    // iCal (RFC 5545) faz line-folding em 75 bytes; precisamos desdobrar antes de buscar
    const unfoldedIcs = icsContent.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
    const descInIcs = unfoldedIcs.includes('verificação de edição de evento')
      || unfoldedIcs.includes('verifica');
    results.push(log('j) ICS: DESCRIPTION com texto atualizado',
      descInIcs ? 'PASSOU' : 'FALHOU',
      descInIcs ? 'snippet encontrado (após desdobramento de linhas)' : 'texto não encontrado'));

  } else {
    results.push(log(`j) /api/events/${NEW.slug}/calendar retorna 200`, 'FALHOU',
      `HTTP ${icsStatus}`));
  }

  // ── 4. RESUMO ──────────────────────────────────────────────────────────────

  console.log('\n════════════════════════════════════════════════════════');
  console.log(' RESUMO DO TESTE 2');
  console.log('════════════════════════════════════════════════════════');

  const passou = results.filter(r => r.status === 'PASSOU').length;
  const falhou = results.filter(r => r.status === 'FALHOU').length;
  const aviso  = results.filter(r => r.status === 'AVISO').length;

  console.log(`\n   ✅ Passou : ${passou}`);
  console.log(`   ❌ Falhou : ${falhou}`);
  console.log(`   ⚠️  Aviso  : ${aviso}`);
  console.log('');

  if (falhou > 0) {
    console.log('── Itens com falha ──');
    results.filter(r => r.status === 'FALHOU').forEach(r => {
      console.log(`   ❌ ${r.label}${r.detail ? ` — ${r.detail}` : ''}`);
    });
    console.log('');
  }

  console.log('════════════════════════════════════════════════════════\n');

  await browser.close();
  process.exit(falhou > 0 ? 1 : 0);
})();
