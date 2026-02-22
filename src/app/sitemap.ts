import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import {
  EVENT_TOPICS,
  MAIN_CITIES,
  CATEGORY_SLUG_MAP,
  CATEGORY_SINGULAR_TO_SLUG,
  CITY_NAME_TO_SLUG,
  SITE_LAST_UPDATED,
  SITE_URL,
} from '@/lib/constants';

const BASE = SITE_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const topics = EVENT_TOPICS.map((t) => t.slug);
  const categories = Object.keys(CATEGORY_SLUG_MAP);
  // Merge static MAIN_CITIES with DB-registered dynamic city slugs
  const staticCities = MAIN_CITIES.map((c) => c.slug);
  const dbCityPages = await prisma.cityPage.findMany({ select: { slug: true } });
  const cities = [...new Set([...staticCities, ...dbCityPages.map((p) => p.slug)])];

  // ── Single query: only upcoming published events ──────────────────────
  // Pages with no upcoming events are excluded from the sitemap (crawl budget).
  const events = await prisma.event.findMany({
    where: { status: 'PUBLICADO', start_date: { gte: new Date() } },
    select: { slug: true, city: true, topics: true, category: true, updated_at: true },
  });

  // ── Build lastmod lookup maps in memory ────────────────────────────────
  // Global lastmod (most recent update across all events)
  let globalLastmod = new Date(SITE_LAST_UPDATED);

  // Per-dimension lastmod maps
  const lastmodByCity = new Map<string, Date>();
  const lastmodByTopic = new Map<string, Date>();
  const lastmodByCategory = new Map<string, Date>();

  // Composite key lastmod maps
  const lastmodByTopicCity = new Map<string, Date>();
  const lastmodByTopicCategory = new Map<string, Date>();
  const lastmodByCategoryCity = new Map<string, Date>();
  const lastmodByTopicCategoryCity = new Map<string, Date>();

  function updateMax(map: Map<string, Date>, key: string, date: Date) {
    const current = map.get(key);
    if (!current || date > current) map.set(key, date);
  }

  for (const ev of events) {
    const d = ev.updated_at;
    if (d > globalLastmod) globalLastmod = d;

    // City
    const citySlug = CITY_NAME_TO_SLUG[ev.city];
    if (citySlug) {
      updateMax(lastmodByCity, citySlug, d);
    }

    // Category
    const catSlug = CATEGORY_SINGULAR_TO_SLUG[ev.category];
    if (catSlug) {
      updateMax(lastmodByCategory, catSlug, d);

      // Category × City
      if (citySlug) {
        updateMax(lastmodByCategoryCity, `${catSlug}/${citySlug}`, d);
      }
    }

    // Topics (each event can have multiple)
    for (const topic of ev.topics) {
      updateMax(lastmodByTopic, topic, d);

      // Topic × City
      if (citySlug) {
        updateMax(lastmodByTopicCity, `${topic}/${citySlug}`, d);
      }

      // Topic × Category
      if (catSlug) {
        updateMax(lastmodByTopicCategory, `${topic}/${catSlug}`, d);

        // Topic × Category × City
        if (citySlug) {
          updateMax(lastmodByTopicCategoryCity, `${topic}/${catSlug}/${citySlug}`, d);
        }
      }
    }
  }

  const entries: MetadataRoute.Sitemap = [];

  // ── a) Static pages ─────────────────────────────────────────────────
  const staticLastmod = globalLastmod;
  entries.push(
    { url: BASE, lastModified: staticLastmod },
    { url: `${BASE}/eventos`, lastModified: staticLastmod },
    { url: `${BASE}/alertas`, lastModified: SITE_LAST_UPDATED },
    { url: `${BASE}/para-organizadores`, lastModified: SITE_LAST_UPDATED },
  );

  // ── b) City pages — only if city has upcoming events ────────────────
  for (const city of cities) {
    if (!lastmodByCity.has(city)) continue;
    entries.push({
      url: `${BASE}/eventos-marketing-${city}`,
      lastModified: lastmodByCity.get(city)!,
    });
  }

  // ── c) Topic pages — only if topic has upcoming events ───────────────
  for (const tema of topics) {
    if (!lastmodByTopic.has(tema)) continue;
    entries.push({
      url: `${BASE}/eventos/${tema}`,
      lastModified: lastmodByTopic.get(tema)!,
    });
  }

  // ── d) Category pages — only if category has upcoming events ─────────
  for (const cat of categories) {
    if (!lastmodByCategory.has(cat)) continue;
    entries.push({
      url: `${BASE}/eventos/${cat}`,
      lastModified: lastmodByCategory.get(cat)!,
    });
  }

  // ── e) Topic × City ─────────────────────────────────────────────────
  for (const tema of topics) {
    for (const city of cities) {
      const key = `${tema}/${city}`;
      if (!lastmodByTopicCity.has(key)) continue;
      entries.push({
        url: `${BASE}/eventos/${tema}/${city}`,
        lastModified: lastmodByTopicCity.get(key)!,
      });
    }
  }

  // ── f) Topic × Category ─────────────────────────────────────────────
  for (const tema of topics) {
    for (const cat of categories) {
      const key = `${tema}/${cat}`;
      if (!lastmodByTopicCategory.has(key)) continue;
      entries.push({
        url: `${BASE}/eventos/${tema}/${cat}`,
        lastModified: lastmodByTopicCategory.get(key)!,
      });
    }
  }

  // ── g) Category × City ──────────────────────────────────────────────
  for (const cat of categories) {
    for (const city of cities) {
      const key = `${cat}/${city}`;
      if (!lastmodByCategoryCity.has(key)) continue;
      entries.push({
        url: `${BASE}/eventos/${cat}/${city}`,
        lastModified: lastmodByCategoryCity.get(key)!,
      });
    }
  }

  // ── h) Topic × Category × City ──────────────────────────────────────
  for (const tema of topics) {
    for (const cat of categories) {
      for (const city of cities) {
        const key = `${tema}/${cat}/${city}`;
        if (!lastmodByTopicCategoryCity.has(key)) continue;
        entries.push({
          url: `${BASE}/eventos/${tema}/${cat}/${city}`,
          lastModified: lastmodByTopicCategoryCity.get(key)!,
        });
      }
    }
  }

  // ── i) Individual event pages ────────────────────────────────────────
  for (const event of events) {
    entries.push({
      url: `${BASE}/evento/${event.slug}`,
      lastModified: event.updated_at,
    });
  }

  return entries;
}
