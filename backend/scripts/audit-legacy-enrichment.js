const Database = require('../node_modules/better-sqlite3');
const { Client } = require('../node_modules/pg');
const fs = require('fs');

function loadEnv(file) {
  const values = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith('#')) continue;
    const split = line.indexOf('=');
    if (split < 1) continue;
    values[line.slice(0, split).trim()] = line.slice(split + 1).trim();
  }
  return values;
}

async function main() {
  const sqlitePath = process.argv[2];
  const envPath = process.argv[3];
  if (!sqlitePath || !envPath) throw new Error('usage: node audit-legacy-enrichment.js SQLITE ENV');
  const env = loadEnv(envPath);
  const sqlite = new Database(sqlitePath, { readonly: true });
  const legacy = sqlite.prepare(`
    SELECT code, categorySlug, photos, description, enrichment
    FROM staging_products
    WHERE (photos IS NOT NULL AND photos NOT IN ('', '[]'))
       OR length(trim(coalesce(description, ''))) > 0
       OR enrichment LIKE '%additionalDescription%'
  `).all();
  const pg = new Client({
    host: env.DB_HOST,
    port: Number(env.DB_PORT || 5432),
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  });
  await pg.connect();
  const result = await pg.query('SELECT code, status, photos, description, enrichment FROM staging_products');
  const production = new Map(result.rows.map(row => [String(row.code).trim().toUpperCase(), row]));
  const report = {
    legacyCandidates: legacy.length,
    matched: 0,
    unmatched: 0,
    photoProductsToRestore: 0,
    photoReferencesToRestore: 0,
    descriptionsToRestore: 0,
    additionalDescriptionsToRestore: 0,
    productionPhotoConflictsSkipped: 0,
    footwear: { matched: 0, photoProducts: 0, photoReferences: 0, descriptions: 0 },
  };
  const unmatchedCodes = [];
  for (const row of legacy) {
    const code = String(row.code).trim().toUpperCase();
    const target = production.get(code);
    if (!target) {
      report.unmatched += 1;
      unmatchedCodes.push(code);
      continue;
    }
    report.matched += 1;
    const footwear = ['bridal-shoes', 'bridal-sneakers'].includes(row.categorySlug);
    if (footwear) report.footwear.matched += 1;
    let sourcePhotos = [];
    let targetPhotos = [];
    try { sourcePhotos = JSON.parse(row.photos || '[]'); } catch {}
    try { targetPhotos = JSON.parse(target.photos || '[]'); } catch {}
    if (sourcePhotos.length && !targetPhotos.length) {
      report.photoProductsToRestore += 1;
      report.photoReferencesToRestore += sourcePhotos.length;
      if (footwear) {
        report.footwear.photoProducts += 1;
        report.footwear.photoReferences += sourcePhotos.length;
      }
    } else if (sourcePhotos.length && targetPhotos.length) {
      report.productionPhotoConflictsSkipped += 1;
    }
    if (row.description?.trim() && !target.description?.trim()) {
      report.descriptionsToRestore += 1;
      if (footwear) report.footwear.descriptions += 1;
    }
    let sourceEnrichment = {};
    let targetEnrichment = {};
    try { sourceEnrichment = JSON.parse(row.enrichment || '{}'); } catch {}
    try { targetEnrichment = JSON.parse(target.enrichment || '{}'); } catch {}
    if (sourceEnrichment.additionalDescription && !targetEnrichment.additionalDescription) {
      report.additionalDescriptionsToRestore += 1;
    }
  }
  report.unmatchedCodes = unmatchedCodes.slice(0, 50);
  console.log(JSON.stringify(report, null, 2));
  await pg.end();
  sqlite.close();
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
