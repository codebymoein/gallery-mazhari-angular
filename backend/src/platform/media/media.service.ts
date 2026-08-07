import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import AdmZip from 'adm-zip';
import { createHash } from 'crypto';
import { basename } from 'path';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { ProductEntity } from '../../products/entities/product.entity';
import { assignImageRoles, parseProductImageFilename } from './image-filename';
import { MediaAssetEntity } from './entities/media-asset.entity';
import { generateImageDerivatives } from './image-derivatives';
import { MediaStorageService } from './media-storage.service';

const MAX_FILE_BYTES = 12 * 1024 * 1024;
const MAX_ZIP_ENTRIES = 5000;
const MAX_ZIP_UNCOMPRESSED = 500 * 1024 * 1024;

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(MediaAssetEntity)
    private readonly media: Repository<MediaAssetEntity>,
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
    private readonly audit: AuditService,
    private readonly storage: MediaStorageService,
  ) {}

  async ingestFiles(input: {
    files: Array<{ originalName: string; buffer: Buffer }>;
    uploadsBaseUrl: string;
    actor?: string | null;
    confirmPrimarySuggestions?: boolean;
    confirmedPublishedCodes?: string[];
  }): Promise<{
    attached: number;
    orphans: number;
    quarantined: number;
    skippedPublished: number;
    assets: MediaAssetEntity[];
  }> {
    const assets: MediaAssetEntity[] = [];
    let attached = 0;
    let orphans = 0;
    let quarantined = 0;
    let skippedPublished = 0;
    const confirmedPublished = new Set(
      (input.confirmedPublishedCodes || []).map((code) =>
        code.trim().toUpperCase(),
      ),
    );

    const validNames: string[] = [];

    for (const file of input.files) {
      const safeName = basename(file.originalName).replace(
        /[^\w.\u0600-\u06FF-]+/g,
        '_',
      );
      const parsed = parseProductImageFilename(safeName);
      const hash = createHash('sha256').update(file.buffer).digest('hex');

      // Exact duplicate content
      const dup = await this.media.findOne({ where: { contentHash: hash } });
      if (dup) {
        // Idempotent upload: the same binary is the same media identity.
        // Do not create another asset/quarantine record or touch a product.
        assets.push(dup);
        continue;
      }

      if (!parsed.valid) {
        const q = await this.quarantine(
          file.buffer,
          safeName,
          hash,
          parsed.reason || 'invalid_filename',
          input.actor,
        );
        assets.push(q);
        quarantined += 1;
        continue;
      }

      if (file.buffer.length > MAX_FILE_BYTES) {
        const q = await this.quarantine(
          file.buffer.slice(0, 64),
          safeName,
          hash,
          'file_too_large',
          input.actor,
        );
        assets.push(q);
        quarantined += 1;
        continue;
      }

      const ft = detectAllowedImage(file.buffer);
      if (!ft) {
        const q = await this.quarantine(
          file.buffer,
          safeName,
          hash,
          'unsupported_or_corrupt_mime',
          input.actor,
        );
        assets.push(q);
        quarantined += 1;
        continue;
      }

      // Very small image warning → quarantine for review (do not delete)
      if (file.buffer.length < 2048) {
        const q = await this.quarantine(
          file.buffer,
          safeName,
          hash,
          'image_too_small',
          input.actor,
        );
        assets.push(q);
        quarantined += 1;
        continue;
      }

      validNames.push(safeName);

      const product = await this.products.findOne({
        where: { code: parsed.productCode },
      });

      if (
        product &&
        (product.status === 'published' ||
          product.status === 'awaiting_stock') &&
        !confirmedPublished.has(product.code.toUpperCase())
      ) {
        skippedPublished += 1;
        continue;
      }

      const role: MediaAssetEntity['role'] =
        parsed.sequence == null ? 'primary' : 'gallery';

      // Sequence/filename conflicts are private quarantine data. Validate them
      // before writing any public object so rejected media is never exposed.
      if (product) {
        const photos = [...(product.photos || [])];
        const conflict = photos.find(
          (p) =>
            p.fileName === safeName ||
            (role === 'primary' && p.role === 'primary') ||
            (parsed.sequence != null &&
              parseProductImageFilename(p.fileName).sequence ===
                parsed.sequence),
        );
        if (conflict) {
          const q = await this.quarantine(
            file.buffer,
            safeName,
            hash,
            'sequence_or_filename_conflict',
            input.actor,
          );
          assets.push(q);
          quarantined += 1;
          continue;
        }
      }

      const storedObject = await this.storage.put({
        buffer: file.buffer,
        contentHash: hash,
        extension: ft.ext,
        contentType: ft.mime,
        visibility: 'public',
        uploadsBaseUrl: input.uploadsBaseUrl,
      });
      const stored = storedObject.key;
      const url = storedObject.url;

      let status: MediaAssetEntity['status'] = 'orphan';
      let productId: string | null = null;

      if (!product) {
        orphans += 1;
      } else {
        productId = product.id;
        status = 'attached';
        attached += 1;

        // Attach without publishing
        const photos = [...(product.photos || [])];
        const entry = {
          url,
          fileName: safeName,
          addedAt: new Date().toISOString(),
          role:
            role === 'primary' ? ('primary' as const) : ('gallery' as const),
          contentHash: hash,
        };

        if (role === 'primary') {
          photos.unshift(entry);
        } else {
          photos.push(entry);
        }
        product.photos = photos.slice(0, 12);

        const prevStatus = product.status;
        if (
          prevStatus !== 'published' &&
          prevStatus !== 'awaiting_stock' &&
          prevStatus !== 'rejected' &&
          prevStatus !== 'archived'
        ) {
          // A photographed queue product is ready for review and moves ahead
          // in its existing category without being auto-published.
          product.status = 'ready_for_approval';
          product.processedAt = new Date().toISOString();
          product.processedBy = input.actor ?? null;
        }

        await this.products.save(product);
      }

      let width: number | null = null;
      let height: number | null = null;
      let derivatives: Record<string, string> | null = null;
      if (storedObject.localPath) {
        try {
          const derived = await generateImageDerivatives(
            storedObject.localPath,
            `${input.uploadsBaseUrl}/uploads/media/${hash.slice(0, 2)}`,
          );
          width = derived.width;
          height = derived.height;
          if (Object.keys(derived.derivatives).length) {
            derivatives = derived.derivatives;
          }
        } catch {
          // Soft-fail: originals remain usable. Object-storage derivative
          // processing is deliberately completed in PR-013.
        }
      }

      const asset = await this.media.save(
        this.media.create({
          productCode: parsed.productCode,
          productId,
          originalFileName: safeName,
          storedFileName: stored,
          url,
          contentHash: hash,
          sequence: parsed.sequence,
          role,
          status,
          quarantineReason: null,
          width,
          height,
          byteSize: file.buffer.length,
          derivatives,
          uploadedBy: input.actor ?? null,
        }),
      );
      assets.push(asset);

      await this.audit.record({
        action: 'media.ingested',
        entityType: 'media_asset',
        entityId: asset.id,
        actor: input.actor,
        newValue: {
          productCode: parsed.productCode,
          status,
          role,
          storageKey: stored,
        },
      });
    }

    // Primary suggestion confirmation for groups missing base image
    const roles = assignImageRoles(validNames);
    for (const assignment of roles.values()) {
      if (
        assignment.needsPrimaryConfirmation &&
        !input.confirmPrimarySuggestions
      ) {
        // leave as gallery; admin must confirm
      }
    }

    return { attached, orphans, quarantined, skippedPublished, assets };
  }

  async inspectZip(buffer: Buffer): Promise<{
    totalFiles: number;
    validImages: number;
    invalidFiles: string[];
    groups: Array<{
      productCode: string;
      files: string[];
      productId: string | null;
      productName: string | null;
      productStatus: string | null;
      category: string | null;
      match: 'queue' | 'published' | 'missing';
      requiresConfirmation: boolean;
    }>;
  }> {
    const entries = this.safeExtractZip(buffer);
    const grouped = new Map<string, string[]>();
    const invalidFiles: string[] = [];
    for (const entry of entries) {
      const safeName = basename(entry.originalName);
      const parsed = parseProductImageFilename(safeName);
      if (!parsed.valid) {
        invalidFiles.push(safeName);
        continue;
      }
      const list = grouped.get(parsed.productCode) || [];
      list.push(safeName);
      grouped.set(parsed.productCode, list);
    }
    const groups: Array<{
      productCode: string;
      files: string[];
      productId: string | null;
      productName: string | null;
      productStatus: string | null;
      category: string | null;
      match: 'queue' | 'published' | 'missing';
      requiresConfirmation: boolean;
    }> = [];
    for (const [productCode, files] of grouped) {
      const product = await this.products.findOne({
        where: { code: productCode },
      });
      const published =
        product?.status === 'published' || product?.status === 'awaiting_stock';
      groups.push({
        productCode,
        files: files.sort((a, b) => {
          const pa = parseProductImageFilename(a);
          const pb = parseProductImageFilename(b);
          return (pa.sequence ?? 0) - (pb.sequence ?? 0);
        }),
        productId: product?.id ?? null,
        productName: product?.name ?? null,
        productStatus: product?.status ?? null,
        category: product?.category ?? null,
        match: !product
          ? ('missing' as const)
          : published
            ? ('published' as const)
            : ('queue' as const),
        requiresConfirmation: !!published,
      });
    }
    return {
      totalFiles: entries.length,
      validImages: [...grouped.values()].reduce(
        (sum, files) => sum + files.length,
        0,
      ),
      invalidFiles,
      groups,
    };
  }

  async ingestZip(input: {
    buffer: Buffer;
    uploadsBaseUrl: string;
    actor?: string | null;
    confirmPrimarySuggestions?: boolean;
    confirmedPublishedCodes?: string[];
  }) {
    const entries = this.safeExtractZip(input.buffer);
    return this.ingestFiles({
      files: entries,
      uploadsBaseUrl: input.uploadsBaseUrl,
      actor: input.actor,
      confirmPrimarySuggestions: input.confirmPrimarySuggestions,
      confirmedPublishedCodes: input.confirmedPublishedCodes,
    });
  }

  /**
   * ZIP extraction with zip-bomb and path-traversal protection.
   */
  safeExtractZip(
    buffer: Buffer,
  ): Array<{ originalName: string; buffer: Buffer }> {
    let zip: AdmZip;
    try {
      zip = new AdmZip(buffer);
    } catch {
      throw new BadRequestException('invalid_zip');
    }

    const entries = zip.getEntries();
    if (entries.length > MAX_ZIP_ENTRIES) {
      throw new BadRequestException('zip_too_many_entries');
    }

    let totalUncompressed = 0;
    const files: Array<{ originalName: string; buffer: Buffer }> = [];

    for (const entry of entries) {
      if (entry.isDirectory) continue;
      const name = entry.entryName.replace(/\\/g, '/');
      if (
        name.includes('..') ||
        name.startsWith('/') ||
        /^[A-Za-z]:/.test(name)
      ) {
        throw new BadRequestException(`zip_path_traversal:${name}`);
      }
      const data = entry.getData();
      totalUncompressed += data.length;
      if (totalUncompressed > MAX_ZIP_UNCOMPRESSED) {
        throw new BadRequestException('zip_bomb_suspected');
      }
      files.push({ originalName: basename(name), buffer: data });
    }

    return files;
  }

  private async quarantine(
    buffer: Buffer,
    originalName: string,
    hash: string,
    reason: string,
    actor: string | null | undefined,
  ): Promise<MediaAssetEntity> {
    const extension = extensionFromName(originalName);
    const storedObject = await this.storage.put({
      buffer,
      contentHash: hash,
      extension,
      contentType: 'application/octet-stream',
      visibility: 'private',
    });
    return this.media.save(
      this.media.create({
        productCode: '',
        productId: null,
        originalFileName: originalName,
        storedFileName: storedObject.key,
        url: storedObject.url,
        contentHash: hash,
        sequence: null,
        role: 'unknown',
        status: 'quarantine',
        quarantineReason: reason,
        width: null,
        height: null,
        byteSize: buffer.length,
        derivatives: null,
        uploadedBy: actor ?? null,
      }),
    );
  }

  listOrphans(): Promise<MediaAssetEntity[]> {
    return this.media.find({
      where: { status: 'orphan' },
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  listQuarantine(): Promise<MediaAssetEntity[]> {
    return this.media.find({
      where: { status: 'quarantine' },
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  async reattachOrphans(actor?: string | null): Promise<{ attached: number }> {
    const orphans = await this.listOrphans();
    let attached = 0;
    for (const asset of orphans) {
      const product = await this.products.findOne({
        where: { code: asset.productCode },
      });
      if (!product) continue;
      asset.productId = product.id;
      asset.status = 'attached';
      const photos = [...(product.photos || [])];
      if (!photos.some((p) => p.contentHash === asset.contentHash)) {
        photos.push({
          url: asset.url,
          fileName: asset.originalFileName,
          addedAt: new Date().toISOString(),
          role: asset.role === 'primary' ? 'primary' : 'gallery',
          contentHash: asset.contentHash,
        });
        product.photos = photos;
        if (
          product.status !== 'published' &&
          product.status !== 'awaiting_stock' &&
          product.status !== 'rejected' &&
          product.status !== 'archived'
        ) {
          product.status = 'ready_for_approval';
          product.processedAt = new Date().toISOString();
          product.processedBy = actor ?? null;
        }
        await this.products.save(product);
      }
      await this.media.save(asset);
      attached += 1;
      await this.audit.record({
        action: 'media.reattached',
        entityType: 'media_asset',
        entityId: asset.id,
        actor,
      });
    }
    return { attached };
  }

  async getAsset(id: string): Promise<MediaAssetEntity> {
    const a = await this.media.findOne({ where: { id } });
    if (!a) throw new NotFoundException('media_not_found');
    return a;
  }

  /** Products that exist without any attached photos — operator warning queue */
  async listProductsMissingImages(
    limit = 200,
  ): Promise<
    Array<{ code: string; name: string; status: string; stock: number }>
  > {
    const products = await this.products.find({
      take: Math.min(limit * 3, 2000),
      order: { updatedAt: 'DESC' },
    });
    return products
      .filter((p) => !p.photos?.length)
      .slice(0, limit)
      .map((p) => ({
        code: p.code,
        name: p.name,
        status: p.status,
        stock: p.stock,
      }));
  }

  async mediaHealthReport(): Promise<Record<string, number | string>> {
    const [orphans, quarantine, attached, missing] = await Promise.all([
      this.media.count({ where: { status: 'orphan' } }),
      this.media.count({ where: { status: 'quarantine' } }),
      this.media.count({ where: { status: 'attached' } }),
      this.listProductsMissingImages(5000),
    ]);
    const withDerivatives = await this.media
      .createQueryBuilder('m')
      .where('m.derivatives IS NOT NULL')
      .getCount();

    return {
      attached,
      orphans,
      quarantine,
      productsMissingImages: missing.length,
      assetsWithDerivatives: withDerivatives,
      storageDriver: this.storage.driver,
      note: 'Orphans = images without product; missing = products without images',
    };
  }
}

function detectAllowedImage(
  buffer: Buffer,
): { ext: string; mime: string } | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }
  if (
    buffer.length >= 8 &&
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { ext: 'png', mime: 'image/png' };
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { ext: 'webp', mime: 'image/webp' };
  }
  if (
    buffer.length >= 6 &&
    ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6))
  ) {
    return { ext: 'gif', mime: 'image/gif' };
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buffer.toString('ascii', 8, 12);
    if (['avif', 'avis'].includes(brand))
      return { ext: 'avif', mime: 'image/avif' };
  }
  return null;
}

function extensionFromName(fileName: string): string {
  const match = /\.([a-z0-9]{1,10})$/i.exec(fileName);
  return match?.[1]?.toLowerCase() || 'bin';
}
