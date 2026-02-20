/**
 * Script de migração: price_info (texto livre) → price_type + price_value (estruturado)
 *
 * Roda com: npx ts-node --project tsconfig.json prisma/migrate-prices.ts
 * (ou: npx tsx prisma/migrate-prices.ts)
 */

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
const prisma = new PrismaClient({ adapter });

// Padrões para detectar "a partir de"
const A_PARTIR_DE_RE = /a partir|from|partir|starting|desde|min\.|mín\.|mínimo/i;
// Extrai valor numérico de uma string de preço
const PRICE_NUM_RE = /[\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?/;

function parseBRLNumber(raw: string): number | null {
  // Brazilian currency rules:
  // 1.300     → 1300  (dot = thousands separator, 3 digits after)
  // 1.300,00  → 1300  (dot = thousands, comma = decimal)
  // 247,00    → 247   (comma = decimal only)
  // 599.99    → 599.99 (dot = decimal, only 2 digits after — English style)
  // 1.866,60  → 1866.60

  const hasDotFollowedBy3 = /\.\d{3}/.test(raw);
  const hasComma = raw.includes(',');

  let normalised: string;
  if (hasDotFollowedBy3) {
    // dot is thousands separator; comma (if present) is decimal
    normalised = raw.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    // comma is decimal separator (e.g. "247,00")
    normalised = raw.replace(',', '.');
  } else {
    // plain number or dot-decimal (e.g. "347" or "599.99")
    normalised = raw;
  }

  const num = parseFloat(normalised);
  return !isNaN(num) && num > 0 ? num : null;
}

function parsePrice(info: string): { price_type: string; price_value: number | null } {
  const isAPartirDe = A_PARTIR_DE_RE.test(info);

  const match = info.match(PRICE_NUM_RE);
  let price_value: number | null = null;
  if (match) {
    price_value = parseBRLNumber(match[0]);
  }

  return {
    price_type: isAPartirDe ? 'a_partir_de' : 'unico',
    price_value,
  };
}

async function main() {
  // Migrate events that either have no price_type yet, OR have price_info set
  // (re-runs safely to fix any bad parses)
  const events = await prisma.event.findMany({
    where: {
      OR: [
        { price_type: null },
        { price_info: { not: null } },
      ],
    },
    select: { id: true, is_free: true, price_info: true, price_type: true },
  });

  console.log(`Found ${events.length} events without price_type.`);

  let updated = 0;
  let skipped = 0;

  for (const ev of events) {
    if (ev.is_free) {
      // Free events: price_type and price_value remain null — already correct
      skipped++;
      continue;
    }

    const info = ev.price_info?.trim();
    if (!info) {
      // No price info available → nao_informado
      await prisma.event.update({
        where: { id: ev.id },
        data: { price_type: 'nao_informado', price_value: null },
      });
      updated++;
      continue;
    }

    const { price_type, price_value } = parsePrice(info);
    await prisma.event.update({
      where: { id: ev.id },
      data: { price_type, price_value },
    });
    updated++;
    console.log(`  [${ev.id}] "${info}" → ${price_type} / ${price_value}`);
  }

  console.log(`Done. Updated: ${updated}, Skipped (free): ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
