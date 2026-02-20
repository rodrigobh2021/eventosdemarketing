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

function parsePrice(info: string): { price_type: string; price_value: number | null } {
  const isAPartirDe = A_PARTIR_DE_RE.test(info);

  const match = info.match(PRICE_NUM_RE);
  let price_value: number | null = null;
  if (match) {
    // Normalise: remove thousand separators, convert decimal comma to dot
    const raw = match[0];
    // Detect if comma is decimal or thousand separator
    const lastCommaIdx = raw.lastIndexOf(',');
    const lastDotIdx = raw.lastIndexOf('.');
    let normalised: string;
    if (lastCommaIdx > lastDotIdx) {
      // comma is decimal separator (Brazilian format: 1.490,00)
      normalised = raw.replace(/\./g, '').replace(',', '.');
    } else {
      // dot is decimal separator or no decimal (1490.00 / 1490)
      normalised = raw.replace(/,/g, '');
    }
    const num = parseFloat(normalised);
    if (!isNaN(num) && num > 0) price_value = num;
  }

  return {
    price_type: isAPartirDe ? 'a_partir_de' : 'unico',
    price_value,
  };
}

async function main() {
  // Only migrate events that still have price_info but no price_type set
  const events = await prisma.event.findMany({
    where: {
      price_type: null,
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
