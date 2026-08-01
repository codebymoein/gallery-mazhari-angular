import { normalizeProductCode, normalizeText } from '../common/text-normalize';

export interface ParsedImageFilename {
  /** Exact product code parsed from filename (no partial prefix match) */
  productCode: string;
  /** null = primary (base filename without sequence) */
  sequence: number | null;
  rawBaseName: string;
  extension: string;
  valid: boolean;
  reason?: string;
}

const IMAGE_EXT = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'avif',
  'tif',
  'tiff',
]);

/**
 * Parse product-image filenames.
 * Rules:
 * - 13700189.jpg → code=13700189, sequence=null (primary)
 * - 13700189-2.jpg / 13700189_2.jpg → gallery seq 2
 * - Exact code token only — never match by partial prefix
 */
export function parseProductImageFilename(
  fileName: string,
): ParsedImageFilename {
  const raw = String(fileName || '').trim();
  const lastDot = raw.lastIndexOf('.');
  if (lastDot <= 0) {
    return {
      productCode: '',
      sequence: null,
      rawBaseName: raw,
      extension: '',
      valid: false,
      reason: 'missing_extension',
    };
  }

  const extension = raw.slice(lastDot + 1).toLowerCase();
  const base = raw.slice(0, lastDot);
  if (!IMAGE_EXT.has(extension)) {
    return {
      productCode: '',
      sequence: null,
      rawBaseName: base,
      extension,
      valid: false,
      reason: 'unsupported_format',
    };
  }

  // Reject path traversal leftovers
  if (base.includes('/') || base.includes('\\') || base.includes('..')) {
    return {
      productCode: '',
      sequence: null,
      rawBaseName: base,
      extension,
      valid: false,
      reason: 'unsafe_path',
    };
  }

  const sepMatch = base.match(/^(.+?)[-_](\d+)$/);
  if (sepMatch) {
    const code = normalizeProductCode(sepMatch[1]);
    const sequence = Number(sepMatch[2]);
    if (!code || !Number.isFinite(sequence) || sequence < 1) {
      return {
        productCode: code,
        sequence: null,
        rawBaseName: base,
        extension,
        valid: false,
        reason: 'invalid_sequence',
      };
    }
    return {
      productCode: code,
      sequence,
      rawBaseName: base,
      extension,
      valid: true,
    };
  }

  const code = normalizeProductCode(base);
  if (!code) {
    return {
      productCode: '',
      sequence: null,
      rawBaseName: base,
      extension,
      valid: false,
      reason: 'missing_product_code',
    };
  }

  return {
    productCode: code,
    sequence: null,
    rawBaseName: base,
    extension,
    valid: true,
  };
}

export interface ImageRoleAssignment {
  productCode: string;
  primaryFileName: string | null;
  galleryOrdered: string[];
  conflicts: string[];
  needsPrimaryConfirmation: boolean;
  suggestedPrimary?: string;
}

/**
 * Assign primary + gallery order for a product's image set.
 * Base filename (no sequence) wins as primary.
 * If missing, suggest lowest sequence but flag for confirmation.
 */
export function assignImageRoles(
  fileNames: string[],
): Map<string, ImageRoleAssignment> {
  const byCode = new Map<
    string,
    Array<{ fileName: string; sequence: number | null }>
  >();

  for (const fileName of fileNames) {
    const parsed = parseProductImageFilename(fileName);
    if (!parsed.valid) continue;
    const list = byCode.get(parsed.productCode) ?? [];
    list.push({ fileName, sequence: parsed.sequence });
    byCode.set(parsed.productCode, list);
  }

  const result = new Map<string, ImageRoleAssignment>();

  for (const [productCode, items] of byCode) {
    const conflicts: string[] = [];
    const seqSeen = new Map<string, string>();

    for (const item of items) {
      const key = item.sequence == null ? 'primary' : `seq:${item.sequence}`;
      if (seqSeen.has(key)) {
        conflicts.push(
          `duplicate_sequence:${key}:${seqSeen.get(key)}|${item.fileName}`,
        );
      } else {
        seqSeen.set(key, item.fileName);
      }
    }

    const primaries = items.filter((i) => i.sequence == null);
    const galleries = items
      .filter((i) => i.sequence != null)
      .sort(
        (a, b) =>
          a.sequence! - b.sequence! || a.fileName.localeCompare(b.fileName),
      );

    const primaryFileName: string | null = primaries[0]?.fileName ?? null;
    let needsPrimaryConfirmation = false;
    let suggestedPrimary: string | undefined;

    if (!primaryFileName && galleries.length) {
      needsPrimaryConfirmation = true;
      suggestedPrimary = galleries[0].fileName;
    }

    if (primaries.length > 1) {
      conflicts.push(
        `multiple_primary:${primaries.map((p) => p.fileName).join('|')}`,
      );
    }

    result.set(productCode, {
      productCode,
      primaryFileName,
      galleryOrdered: galleries.map((g) => g.fileName),
      conflicts,
      needsPrimaryConfirmation,
      suggestedPrimary,
    });
  }

  return result;
}

export function codesMatchExact(a: string, b: string): boolean {
  return normalizeProductCode(a) === normalizeProductCode(b);
}

/** Guard against partial-prefix false positives */
export function isExactCodeMatch(
  parsedCode: string,
  productCode: string,
): boolean {
  return (
    normalizeText(parsedCode) === normalizeText(productCode) &&
    normalizeProductCode(parsedCode) === normalizeProductCode(productCode)
  );
}
