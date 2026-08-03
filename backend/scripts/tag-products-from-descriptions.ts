import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import { copyFileSync, mkdirSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { generateTagSuggestions } from '../src/platform/taxonomy/tagging-engine';

type ProductRow = {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string | null;
  size: string | null;
  color: string | null;
  material: string | null;
  price: number | null;
  enrichment: string | null;
};

const args = process.argv.slice(2);
const valueAfter = (flag: string): string => {
  const index = args.indexOf(flag);
  if (index < 0 || !args[index + 1]) throw new Error(`Missing ${flag}`);
  return args[index + 1];
};

const dbPath = resolve(valueAfter('--db'));
const backupDir = resolve(valueAfter('--backup-dir'));
const commit = args.includes('--commit');
const db = new Database(dbPath);
const products = db.prepare(`
  SELECT id, code, name, category, description, size, color, material, price, enrichment
  FROM staging_products
  WHERE trim(coalesce(description, '')) <> ''
     OR trim(coalesce(json_extract(enrichment, '$.additionalDescription'), '')) <> ''
`).all() as ProductRow[];

const existingStatement = db.prepare(
  'SELECT id FROM platform_product_tags WHERE productId = ? AND tagValue = ?',
);
const insertStatement = db.prepare(`
  INSERT INTO platform_product_tags
    (id, productId, tagValue, confidence, evidence, ruleOrModel, approvalState, taggedAt, createdAt)
  VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);
const updateStatement = db.prepare(`
  UPDATE platform_product_tags
  SET confidence = ?, evidence = ?, ruleOrModel = ?, approvalState = ?, taggedAt = ?
  WHERE id = ?
`);

let added = 0;
let refreshed = 0;
let suggestions = 0;
const taggedProducts = new Set<string>();
const tagCounts = new Map<string, number>();
const now = new Date().toISOString();
const descriptionRuleIds = new Set([
  'keyword.classic',
  'keyword.modern',
  'keyword.vintage',
  'keyword.minimal',
  'keyword.princess',
  'keyword.romantic',
  'keyword.formal',
  'keyword.luxury',
  'keyword.garden',
  'keyword.outdoor',
  'keyword.indoor',
  'cat.shoes',
  'color.white',
  'color.ivory',
  'color.champagne',
]);

const apply = db.transaction(() => {
  for (const product of products) {
    let enrichment: Record<string, unknown> = {};
    try {
      enrichment = JSON.parse(product.enrichment || '{}') as Record<string, unknown>;
    } catch {
      enrichment = {};
    }
    const additional =
      typeof enrichment['additionalDescription'] === 'string'
        ? enrichment['additionalDescription']
        : '';
    const combined = [product.description || '', additional].filter(Boolean).join('\n\n');
    const generated = generateTagSuggestions(
      {
        name: product.name,
        category: product.category,
        description: combined,
        size: product.size,
        color: product.color,
        material: product.material,
        price: product.price,
      },
      undefined,
      new Date(now),
    ).filter(
      (tag) =>
        tag.ruleOrModel.startsWith('description.') ||
        descriptionRuleIds.has(tag.ruleOrModel),
    );
    suggestions += generated.length;
    if (generated.length) taggedProducts.add(product.id);

    for (const tag of generated) {
      const evidence = JSON.stringify([
        'source: short_description + additional_description',
        ...tag.evidence,
      ]);
      const existing = existingStatement.get(product.id, tag.tagValue) as
        | { id: string }
        | undefined;
      if (existing) {
        updateStatement.run(
          tag.confidence,
          evidence,
          tag.ruleOrModel,
          tag.approvalState,
          tag.timestamp,
          existing.id,
        );
        refreshed += 1;
      } else {
        insertStatement.run(
          randomUUID(),
          product.id,
          tag.tagValue,
          tag.confidence,
          evidence,
          tag.ruleOrModel,
          tag.approvalState,
          tag.timestamp,
        );
        added += 1;
      }
      tagCounts.set(tag.tagValue, (tagCounts.get(tag.tagValue) || 0) + 1);
    }
  }
});

let backup: string | undefined;
if (commit) {
  mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
  backup = join(backupDir, `${basename(dbPath, '.sqlite')}-before-description-tags-${stamp}.sqlite`);
  db.pragma('wal_checkpoint(FULL)');
  copyFileSync(dbPath, backup);
  apply();
}

console.log(
  JSON.stringify(
    {
      productsWithDescriptions: products.length,
      taggedProducts: taggedProducts.size,
      suggestions,
      added: commit ? added : 0,
      refreshed: commit ? refreshed : 0,
      commit,
      backup,
      topTags: [...tagCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
        .map(([tag, count]) => ({ tag, count })),
    },
    null,
    2,
  ),
);

db.close();
