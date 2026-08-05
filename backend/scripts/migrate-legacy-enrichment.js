const Database = require('../node_modules/better-sqlite3');
const { Client } = require('../node_modules/pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

function json(value, fallback) {
  try { return JSON.parse(value || ''); } catch { return fallback; }
}

function extension(contentType, url) {
  const types = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
  if (types[contentType]) return types[contentType];
  const match = new URL(url).pathname.match(/\.(jpe?g|png|webp|gif)$/i);
  return match ? match[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg';
}

async function download(photo, code, index, destination, publicBase) {
  const source = new URL(photo.url);
  if (!['gallerymazhari.com', 'www.gallerymazhari.com'].includes(source.hostname)) {
    throw new Error(`untrusted image host: ${source.hostname}`);
  }
  const response = await fetch(source, { signal: AbortSignal.timeout(45000), redirect: 'follow' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const contentType = (response.headers.get('content-type') || '').split(';')[0].toLowerCase();
  if (!contentType.startsWith('image/')) throw new Error(`not an image: ${contentType}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 256 || buffer.length > 12 * 1024 * 1024) throw new Error(`invalid size: ${buffer.length}`);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  const ext = extension(contentType, source.href);
  const safeCode = code.replace(/[^a-zA-Z0-9_-]/g, '_');
  const stored = `legacy-${safeCode}-${index + 1}-${hash.slice(0, 12)}.${ext}`;
  const target = path.join(destination, stored);
  if (!fs.existsSync(target)) fs.writeFileSync(target, buffer, { flag: 'wx' });
  return {
    url: `${publicBase}/uploads/products/${stored}`,
    fileName: photo.fileName || path.basename(source.pathname),
    addedAt: new Date().toISOString(),
    role: index === 0 ? 'primary' : 'gallery',
    contentHash: hash,
  };
}

async function parallel(items, concurrency, worker) {
  let cursor = 0;
  const output = new Array(items.length);
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      try { output[index] = { ok: true, value: await worker(items[index], index) }; }
      catch (error) { output[index] = { ok: false, error: String(error.message || error) }; }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, run));
  return output;
}

async function main() {
  const sqlitePath = process.argv[2];
  const envPath = process.argv[3];
  const reportPath = process.argv[4];
  if (!sqlitePath || !envPath || !reportPath) throw new Error('usage: node migrate-legacy-enrichment.js SQLITE ENV REPORT');
  const env = loadEnv(envPath);
  const uploads = path.resolve(path.dirname(envPath), 'uploads', 'products');
  fs.mkdirSync(uploads, { recursive: true });
  const publicBase = (env.BACKEND_PUBLIC_URL || '').replace(/\/$/, '');
  if (!publicBase.startsWith('https://')) throw new Error('BACKEND_PUBLIC_URL must be HTTPS');

  const sqlite = new Database(sqlitePath, { readonly: true });
  const legacy = sqlite.prepare(`
    SELECT code, categorySlug, photos, description, enrichment
    FROM staging_products
    WHERE (photos IS NOT NULL AND photos NOT IN ('', '[]'))
       OR length(trim(coalesce(description, ''))) > 0
       OR enrichment LIKE '%additionalDescription%'
  `).all();
  const pg = new Client({ host: env.DB_HOST, port: Number(env.DB_PORT || 5432), user: env.DB_USERNAME, password: env.DB_PASSWORD, database: env.DB_NAME });
  await pg.connect();
  const currentResult = await pg.query('SELECT code, status, photos, description, enrichment FROM staging_products');
  const current = new Map(currentResult.rows.map(row => [String(row.code).trim().toUpperCase(), row]));
  const jobs = [];
  const rows = [];
  for (const source of legacy) {
    const code = String(source.code).trim().toUpperCase();
    const target = current.get(code);
    if (!target) continue;
    const sourcePhotos = json(source.photos, []).slice(0, 12);
    const targetPhotos = json(target.photos, []);
    const row = { code, source, target, downloaded: [], failures: [] };
    rows.push(row);
    if (sourcePhotos.length && !targetPhotos.length) {
      sourcePhotos.forEach((photo, index) => jobs.push({ row, photo, index }));
    }
  }
  const downloads = await parallel(jobs, 6, job => download(job.photo, job.row.code, job.index, uploads, publicBase));
  downloads.forEach((result, index) => {
    const job = jobs[index];
    if (result.ok) job.row.downloaded[job.index] = result.value;
    else job.row.failures.push({ url: job.photo.url, error: result.error });
  });

  const report = { matched: rows.length, updated: 0, photoProducts: 0, photos: 0, descriptions: 0, additionalDescriptions: 0, movedToApproval: 0, failures: [] };
  await pg.query('BEGIN');
  try {
    for (const row of rows) {
      const existingPhotos = json(row.target.photos, []);
      const photos = existingPhotos.length ? existingPhotos : row.downloaded.filter(Boolean);
      const sourceDescription = row.source.description?.trim() || '';
      const fullDescription = row.target.description?.trim() || sourceDescription || null;
      const description = fullDescription?.slice(0, 2000) || null;
      const oldEnrichment = json(row.target.enrichment, {});
      const sourceEnrichment = json(row.source.enrichment, {});
      const enrichment = { ...oldEnrichment };
      if (!enrichment.additionalDescription && sourceEnrichment.additionalDescription) {
        enrichment.additionalDescription = sourceEnrichment.additionalDescription;
        report.additionalDescriptions += 1;
      }
      if (sourceDescription.length > 2000 && !enrichment.legacyFullDescription) {
        enrichment.legacyFullDescription = sourceDescription;
      }
      if (photos.length && !existingPhotos.length) {
        enrichment.legacyMediaMigratedAt = new Date().toISOString();
        enrichment.legacyMediaSource = 'gallerymazhari.com';
        report.photoProducts += 1;
        report.photos += photos.length;
      }
      if (!row.target.description?.trim() && description) report.descriptions += 1;
      const shouldApprove = photos.length && ['waiting_photo', 'media_pending'].includes(row.target.status);
      if (shouldApprove) report.movedToApproval += 1;
      const result = await pg.query(
        `UPDATE staging_products
         SET photos=$1, description=$2, enrichment=$3,
             status=CASE WHEN $4 THEN 'ready_for_approval' ELSE status END,
             "processedAt"=CASE WHEN $4 THEN $5 ELSE "processedAt" END,
             "processedBy"=CASE WHEN $4 THEN 'legacy-production-migration' ELSE "processedBy" END,
             "updatedAt"=CURRENT_TIMESTAMP
         WHERE upper(trim(code))=$6`,
        [JSON.stringify(photos), description, JSON.stringify(enrichment), Boolean(shouldApprove), new Date().toISOString(), row.code],
      );
      report.updated += result.rowCount;
      report.failures.push(...row.failures.map(failure => ({ code: row.code, ...failure })));
    }
    await pg.query('COMMIT');
  } catch (error) {
    await pg.query('ROLLBACK');
    throw error;
  }
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await pg.end();
  sqlite.close();
}

main().catch(error => { console.error(error); process.exit(1); });
