import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { sha256 } from '../common/hash';
import { normalizeProductCode, normalizeText } from '../common/text-normalize';
import { JobsService } from '../jobs/jobs.service';
import { PlatformJobEntity } from '../jobs/entities/platform-job.entity';
import { ProductEntity } from '../../products/entities/product.entity';
import { ColumnMapping, suggestColumnMapping } from './column-mapper';
import { CommitRow, DryRunReport, runExcelDryRun } from './dry-run.engine';
import { parseExcelBuffer } from './excel-parser';
import {
  ImportRunEntity,
  MappingTemplateEntity,
} from './entities/import-run.entity';
import { ProductVariationEntity } from './entities/product-variation.entity';
import { InventoryAuditEntity } from '../media/entities/media-asset.entity';
import { normalizeColorValue, normalizeSizeValue } from './variation-detector';
import { generateTagSuggestions } from '../taxonomy/tagging-engine';
import { ProductTagEntity } from '../taxonomy/entities/taxonomy.entities';
import { generateProductSeo } from '../seo/seo-engine';
import { classifyProductCategory } from './category-classifier';

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(ImportRunEntity)
    private readonly runs: Repository<ImportRunEntity>,
    @InjectRepository(MappingTemplateEntity)
    private readonly templates: Repository<MappingTemplateEntity>,
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
    @InjectRepository(ProductVariationEntity)
    private readonly variations: Repository<ProductVariationEntity>,
    @InjectRepository(InventoryAuditEntity)
    private readonly inventoryAudits: Repository<InventoryAuditEntity>,
    @InjectRepository(ProductTagEntity)
    private readonly productTags: Repository<ProductTagEntity>,
    private readonly audit: AuditService,
    private readonly jobs: JobsService,
  ) {
    this.jobs.registerHandler('import.commit', (job) =>
      this.handleCommitJob(job),
    );
  }

  async dryRun(input: {
    buffer: Buffer;
    fileName: string;
    mapping?: ColumnMapping;
    confirmUncertainMapping?: boolean;
    preserveInventory?: boolean;
    sourceTimestamp?: string | null;
    actor?: string | null;
  }): Promise<{ run: ImportRunEntity; report: DryRunReport }> {
    let parsed;
    try {
      parsed = parseExcelBuffer(input.buffer);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'parse_error';
      throw new BadRequestException(`excel_parse_failed:${msg}`);
    }

    const existing = await this.products.find();
    const existingVariations = await this.variations.find();
    const existingById = new Map(existing.map((product) => [product.id, product]));
    const previousCompletedRun = await this.runs.findOne({
      where: { status: 'completed' },
      order: { updatedAt: 'DESC' },
    });
    const previousReport = previousCompletedRun?.report as
      Partial<DryRunReport> | null | undefined;
    const knownCategories = new Set(
      existing
        .map((p) => (p.category || '').trim().toLowerCase())
        .filter(Boolean),
    );

    // Suggest saved template by header fingerprint
    const template = await this.templates.findOne({
      where: { headerFingerprint: parsed.headerFingerprint },
    });

    const mapping = input.mapping || (template
      ? { ...suggestColumnMapping(parsed.headers).mapping, ...template.mapping }
      : undefined);

    const report = runExcelDryRun({
      headers: parsed.headers,
      rows: parsed.rows,
      mapping,
      confirmUncertainMapping: input.confirmUncertainMapping,
      existing: [
        ...existing.map((p) => ({
        code: p.code,
        barcode: p.barcode,
        name: p.name,
        stock: p.stock,
        price: p.price,
        category: p.category,
        updatedAt: p.updatedAt?.toISOString?.() ?? null,
        inventoryUpdatedAt: p.inventoryUpdatedAt,
        status: p.status,
        })),
        ...existingVariations.flatMap((variation) => {
          const parent = existingById.get(variation.parentProductId);
          if (!parent) return [];
          return [...new Set([variation.sku, variation.barcode])]
            .filter(Boolean)
            .map((alias) => ({
              code: alias,
              barcode: alias,
              name: parent.name,
              stock: parent.stock,
              price: parent.price,
              category: parent.category,
              updatedAt: parent.updatedAt?.toISOString?.() ?? null,
              inventoryUpdatedAt: parent.inventoryUpdatedAt,
              status: parent.status,
            }));
        }),
      ],
      knownCategories,
      sourceTimestamp: input.sourceTimestamp,
      fileBufferHash: sha256(input.buffer),
      previousInStockProductCodes: previousReport?.inStockProductCodes ?? null,
      preserveInventory: input.preserveInventory,
    });

    // Idempotent dry-run upsert by fingerprint
    let run = await this.runs.findOne({
      where: { fingerprint: report.fingerprint },
    });
    if (!run) {
      run = this.runs.create({
        fingerprint: report.fingerprint,
        mode: 'dry_run',
        status: 'dry_run_complete',
        fileName: input.fileName,
        mapping: report.mapping as Record<string, string>,
        mappingConfidence: report.mappingConfidence,
        report: report as unknown as Record<string, unknown>,
        createdBy: input.actor ?? null,
        sourceTimestamp: input.sourceTimestamp ?? null,
      });
    } else {
      run.report = report as unknown as Record<string, unknown>;
      run.mapping = report.mapping;
      run.mappingConfidence = report.mappingConfidence;
      run.fileName = input.fileName;
      run.status = 'dry_run_complete';
      run.mode = 'dry_run';
    }
    run = await this.runs.save(run);

    await this.audit.record({
      action: 'import.dry_run',
      entityType: 'import_run',
      entityId: run.id,
      importId: run.id,
      actor: input.actor,
      newValue: {
        totalRows: report.totalRows,
        validRows: report.validRows,
        newProducts: report.newProducts,
      },
      source: input.fileName,
    });

    return {
      run,
      report: {
        ...report,
        // expose template suggestion
        mappingUncertainFields: [
          ...report.mappingUncertainFields,
          ...(template
            ? []
            : report.mappingConfidence < 0.85
              ? ['confirm_mapping']
              : []),
        ],
      },
    };
  }

  async confirmImport(input: {
    importId: string;
    actor?: string | null;
    inventoryStrategy?: 'preserve_inventory' | 'full_replace' | 'incremental';
  }): Promise<{ job: PlatformJobEntity; run: ImportRunEntity }> {
    const run = await this.runs.findOne({ where: { id: input.importId } });
    if (!run) throw new NotFoundException('import_not_found');
    if (!run.report) throw new BadRequestException('missing_dry_run_report');

    const report = run.report as unknown as DryRunReport;
    if (report.canCommit === false) {
      throw new BadRequestException({
        code: 'import_blocked_validation',
        message: 'Validation failed — resolve blocking errors before confirm',
        blockingErrorCount: report.blockingErrorCount ?? 0,
        issues: (report.issues || [])
          .filter((i) => i.severity === 'error')
          .slice(0, 50),
      });
    }
    const blocking = (report.issues || []).filter(
      (i) => i.severity === 'error',
    );
    if (blocking.length > 0) {
      throw new BadRequestException({
        code: 'import_blocked_validation',
        message: 'Validation failed — resolve blocking errors before confirm',
        blockingErrorCount: blocking.length,
        issues: blocking.slice(0, 50),
      });
    }

    // Idempotent: if already completed with same fingerprint, return existing
    if (run.status === 'completed') {
      const job = run.jobId
        ? await this.jobs.get(run.jobId)
        : await this.jobs.enqueue({
            type: 'import.commit',
            payload: { importId: run.id, noop: true },
            createdBy: input.actor,
          });
      return { job, run };
    }

    run.mode = 'commit';
    run.status = 'queued';
    run.confirmedBy = input.actor ?? null;
    await this.runs.save(run);

    const job = await this.jobs.enqueue({
      type: 'import.commit',
      payload: {
        importId: run.id,
        inventoryStrategy: input.inventoryStrategy ?? 'preserve_inventory',
        actor: input.actor,
      },
      createdBy: input.actor,
      totalItems: (run.report as { validRows?: number }).validRows ?? 0,
    });

    run.jobId = job.id;
    await this.runs.save(run);

    await this.audit.record({
      action: 'import.confirm',
      entityType: 'import_run',
      entityId: run.id,
      importId: run.id,
      actor: input.actor,
      source: run.fileName,
    });

    return { job, run };
  }

  private async handleCommitJob(
    job: PlatformJobEntity,
  ): Promise<Record<string, unknown>> {
    const importId = String(job.payload?.['importId'] ?? '');
    const actor = (job.payload?.['actor'] as string) || null;
    const strategy =
      (job.payload?.['inventoryStrategy'] as
        | 'preserve_inventory'
        | 'full_replace'
        | 'incremental') || 'preserve_inventory';
    const preserveInventory = strategy === 'preserve_inventory';

    const run = await this.runs.findOne({ where: { id: importId } });
    if (!run?.report) throw new Error('import_report_missing');

    run.status = 'processing';
    await this.runs.save(run);

    const report = run.report as unknown as DryRunReport;
    const changeSet: {
      products: Array<{
        code: string;
        previous: Partial<ProductEntity> | null;
      }>;
      variations: string[];
    } = { products: [], variations: [] };

    let added = 0;
    let updated = 0;
    let skipped = 0;
    const now = new Date().toISOString();
    const processedParents = new Set<string>();
    const preserveProducts = preserveInventory ? await this.products.find() : [];
    const preserveById = new Map(preserveProducts.map((product) => [product.id, product]));
    const preserveByCode = new Map(
      preserveProducts.map((product) => [normalizeProductCode(product.code), product]),
    );
    const preserveNameBuckets = new Map<string, ProductEntity[]>();
    for (const product of preserveProducts) {
      const key = normalizeText(product.name);
      if (!key) continue;
      const bucket = preserveNameBuckets.get(key) ?? [];
      bucket.push(product);
      preserveNameBuckets.set(key, bucket);
    }
    const preserveByAlias = new Map<string, ProductEntity>();
    if (preserveInventory) {
      for (const variation of await this.variations.find()) {
        const parent = preserveById.get(variation.parentProductId);
        if (!parent) continue;
        for (const alias of [variation.sku, variation.barcode]) {
          if (alias) preserveByAlias.set(normalizeProductCode(alias), parent);
        }
      }
    }

    // Skip hard-error duplicate codes/barcodes from commit
    const blockedCodes = new Set([
      ...report.duplicateProductCodes,
      ...report.issues
        .filter((i) => i.severity === 'error')
        .map((i) => normalizeProductCode(i.code)),
    ]);

    const rows = (report.commitRows || []).filter(
      (r) => !blockedCodes.has(r.code) && !r.internal,
    );

    await this.jobs.updateProgress(job.id, {
      totalItems: rows.length,
      currentStep: 'upsert_products',
    });

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const code = normalizeProductCode(row.code);
      const nameMatches = preserveNameBuckets.get(normalizeText(row.name)) ?? [];
      const preserveTarget = preserveInventory
        ? preserveByCode.get(code) ||
          preserveByAlias.get(code) ||
          (nameMatches.length === 1 ? nameMatches[0] : undefined)
        : undefined;

      if (row.parentCode) {
        const parentCode = normalizeProductCode(row.parentCode);
        let parent = preserveTarget || await this.products.findOne({
          where: { code: parentCode },
        });

        if (preserveInventory && !parent) {
          skipped += 1;
          continue;
        }

        if (parent?.status === 'rejected') {
          if (!processedParents.has(parentCode)) {
            if (!preserveInventory) {
              parent.stock = 0;
              parent.inventoryUpdatedAt = now;
              await this.products.save(parent);
              const rejectedVariations = await this.variations.find({
                where: { parentProductId: parent.id },
              });
              for (const variation of rejectedVariations) {
                variation.stock = 0;
                variation.available = false;
                await this.variations.save(variation);
              }
            }
            processedParents.add(parentCode);
          }
          skipped += 1;
          continue;
        }

        if (!parent) {
          parent = this.products.create({
            code: parentCode,
            name: row.name,
            category: row.category || 'نامشخص',
            parentCategory: '',
            parentCategorySlug: '',
            categorySlug: '',
            stock: 0,
            photos: [],
            status: 'media_pending',
            productType: 'variable',
            isNewImport: true,
            importedAt: now,
            reservedStock: 0,
            lowStockThreshold: 2,
          });
          added += 1;
        } else if (!processedParents.has(parentCode)) {
          updated += 1;
        }

        if (!processedParents.has(parentCode)) {
          changeSet.products.push({
            code: parentCode,
            previous: parent.id
              ? {
                  name: parent.name,
                  stock: parent.stock,
                  price: parent.price,
                  category: parent.category,
                  status: parent.status,
                }
              : null,
          });
        }

        parent.name = row.name;
        const classified = classifyProductCategory(row.name, row.category);
        parent.category = classified.category;
        parent.categorySlug = classified.categorySlug;
        parent.parentCategory = classified.parentCategory;
        parent.parentCategorySlug = classified.parentCategorySlug;
        parent.productType = 'variable';
        if (!preserveInventory) parent.price = row.price;
        parent.photos = this.mergeLegacyPhotos(parent.photos, row.imageUrls, now);
        if (!preserveInventory) {
          parent.stock = rows
            .filter(
              (candidate) =>
                normalizeProductCode(candidate.parentCode || '') === parentCode,
            )
            .reduce((sum, candidate) => sum + candidate.stock, 0);
          parent.inventoryUpdatedAt = now;
        }
        parent.lastImportId = run.id;
        parent.isNewImport = row.changeType === 'new';
        parent = await this.products.save(parent);
        processedParents.add(parentCode);

        await this.upsertVariation(
          parent,
          row,
          run.id,
          changeSet,
          preserveInventory,
        );
        await this.ensureCategoryDefaultTag(
          parent,
          classified.categorySlug,
          classified.evidence,
        );
        continue;
      }

      let product = preserveTarget || await this.products.findOne({ where: { code } });

      if (preserveInventory && !product) {
        skipped += 1;
        continue;
      }

      if (product?.status === 'rejected') {
        product.stock = 0;
        product.inventoryUpdatedAt = now;
        await this.products.save(product);
        skipped += 1;
        continue;
      }

      const previous = product
        ? {
            name: product.name,
            stock: product.stock,
            price: product.price,
            category: product.category,
            barcode: product.barcode,
            status: product.status,
          }
        : null;

      // Stale inventory protection
      if (
        !preserveInventory &&
        product?.inventoryUpdatedAt &&
        run.sourceTimestamp &&
        new Date(run.sourceTimestamp) < new Date(product.inventoryUpdatedAt)
      ) {
        skipped += 1;
        await this.inventoryAudits.save(
          this.inventoryAudits.create({
            productCode: code,
            previousStock: product.stock,
            newStock: product.stock,
            strategy: 'skipped_stale',
            importId: run.id,
            sourceReference: run.fileName,
            actor,
          }),
        );
        continue;
      }

      if (!product) {
        product = this.products.create({
          code,
          name: row.name,
          category: row.category || 'نامشخص',
          parentCategory: '',
          parentCategorySlug: '',
          categorySlug: '',
          stock: 0,
          photos: [],
          status: 'draft',
          productType: row.parentCode ? 'variation' : 'simple',
          isNewImport: true,
          importedAt: now,
          reservedStock: 0,
          lowStockThreshold: 2,
        });
        added += 1;
      } else {
        updated += 1;
      }

      changeSet.products.push({ code: product.code, previous });

      product.name = row.name;
      const classified = classifyProductCategory(row.name, row.category);
      product.category = classified.category;
      product.categorySlug = classified.categorySlug;
      product.parentCategory = classified.parentCategory;
      product.parentCategorySlug = classified.parentCategorySlug;
      product.barcode = row.barcode;
      product.parentCode = row.parentCode;
      if (!preserveInventory) {
        product.price = row.price;
        product.salePrice = row.salePrice;
      }
      product.size = normalizeSizeValue(row.size);
      const colorNorm = normalizeColorValue(row.color);
      product.color = colorNorm.canonical || row.color;
      product.material = row.material;
      product.brand = row.brand;
      product.description = row.description;
      product.photos = this.mergeLegacyPhotos(product.photos, row.imageUrls, now);
      product.branch = row.branch;
      product.collection = row.collection;
      product.lastImportId = run.id;
      product.isNewImport = row.changeType === 'new';

      // A legacy metadata/photo import must not change publication workflow.
      // For authoritative imports, never auto-publish.
      if (!preserveInventory && product.status === 'published') {
        // material change → pending review, stay unpublished until re-approved
        if (previous && previous.stock !== row.stock) {
          // inventory-only update may keep published if policy allows;
          // material field changes force review
        }
        const materialChanged =
          previous &&
          (previous.name !== row.name ||
            previous.category !== row.category ||
            previous.barcode !== row.barcode);
        if (materialChanged) {
          product.status = 'pending_data_review';
          product.publishedAt = null;
        }
      } else if (
        !preserveInventory &&
        product.status !== 'ready_for_approval' &&
        product.status !== 'waiting_photo'
      ) {
        product.status =
          colorNorm.ambiguous ||
          report.rowsRequiringReview.some((r) => r.code === code)
            ? 'pending_variation_review'
            : product.photos?.length
              ? 'enrichment_pending'
              : 'media_pending';
      }

      const prevStock = product.stock;
      if (preserveInventory) {
        product.stock = prevStock;
      } else if (strategy === 'incremental') {
        product.stock = prevStock + row.stock;
      } else {
        // Parent-level stock only for simple products; variations store own stock
        if (!row.parentCode) {
          product.stock = row.stock;
        } else {
          product.stock = 0; // parent aggregate computed from variations
          product.productType = 'variable';
        }
      }
      if (!preserveInventory) product.inventoryUpdatedAt = now;

      product = await this.products.save(product);

      await this.inventoryAudits.save(
        this.inventoryAudits.create({
          productCode: code,
          previousStock: prevStock,
          newStock: product.stock,
          strategy,
          importId: run.id,
          sourceReference: run.fileName,
          actor,
        }),
      );

      if (row.parentCode && row.barcode) {
        await this.upsertVariation(
          product,
          row,
          run.id,
          changeSet,
          preserveInventory,
        );
      }

      // Hidden enrichment tags
      const suggestions = generateTagSuggestions({
        name: product.name,
        category: product.category,
        description: product.description || undefined,
        size: product.size,
        color: product.color,
        material: product.material,
        price: product.price,
      });
      for (const s of suggestions) {
        const existingTag = await this.productTags.findOne({
          where: { productId: product.id, tagValue: s.tagValue },
        });
        if (existingTag) continue;
        await this.productTags.save(
          this.productTags.create({
            productId: product.id,
            tagValue: s.tagValue,
            confidence: s.confidence,
            evidence: s.evidence,
            ruleOrModel: s.ruleOrModel,
            approvalState: s.approvalState,
            taggedAt: s.timestamp,
          }),
        );
      }
      await this.ensureCategoryDefaultTag(
        product,
        classified.categorySlug,
        classified.evidence,
      );

      // Auto SEO (never invents reviews/ratings)
      const primaryUrl =
        product.photos?.find((p) => p.role === 'primary')?.url ||
        product.photos?.[0]?.url ||
        null;
      product.seo = generateProductSeo({
        code: product.code,
        name: product.name,
        category: product.category,
        description: product.description,
        color: product.color,
        material: product.material,
        brand: product.brand,
        price: product.price,
        stock: product.stock,
        primaryImageUrl: primaryUrl,
      }) as unknown as Record<string, unknown>;
      product = await this.products.save(product);

      if (i % 25 === 0) {
        await this.jobs.updateProgress(job.id, {
          completedItems: i + 1,
          progressPercent: Math.round(((i + 1) / rows.length) * 100),
          currentStep: `upsert:${code}`,
        });
      }
    }

    if (strategy === 'full_replace') {
      const activeParentCodes = new Set(
        (report.inStockProductCodes || []).map(normalizeProductCode),
      );
      const activeVariationBarcodes = new Set(
        rows
          .filter((row) => row.parentCode)
          .map((row) => normalizeProductCode(row.barcode || row.code)),
      );

      // Only products already managed by an inventory import are affected.
      // Manually-created catalog products remain outside this authority scope.
      const managedProducts = await this.products.find();
      for (const product of managedProducts) {
        if (
          !product.lastImportId ||
          activeParentCodes.has(normalizeProductCode(product.code))
        ) {
          continue;
        }
        const previousStock = product.stock;
        product.stock = 0;
        product.inventoryUpdatedAt = now;
        await this.products.save(product);
        await this.inventoryAudits.save(
          this.inventoryAudits.create({
            productCode: product.code,
            previousStock,
            newStock: 0,
            strategy: 'full_replace_absent',
            importId: run.id,
            sourceReference: run.fileName,
            actor,
          }),
        );
      }
      const managedVariations = await this.variations.find();
      for (const variation of managedVariations) {
        if (
          activeVariationBarcodes.has(normalizeProductCode(variation.barcode))
        ) {
          continue;
        }
        variation.stock = 0;
        variation.available = false;
        variation.importId = run.id;
        await this.variations.save(variation);
      }
    }

    // Ensure parent variable products exist
    for (const group of report.groups || []) {
      if (group.kind === 'simple' || group.requiresReview) continue;
      const parentCode = normalizeProductCode(group.parentCode);
      let parent = await this.products.findOne({ where: { code: parentCode } });
      if (!parent) {
        if (preserveInventory) continue;
        const classified = classifyProductCategory(
          group.children[0]?.name || parentCode,
          group.children[0]?.category || '',
        );
        parent = await this.products.save(
          this.products.create({
            code: parentCode,
            name: group.children[0]?.name || parentCode,
            category: classified.category,
            parentCategory: classified.parentCategory,
            parentCategorySlug: classified.parentCategorySlug,
            categorySlug: classified.categorySlug,
            // A metadata-only legacy import is not an inventory authority.
            stock: preserveInventory
              ? 0
              : group.children.reduce(
                  (sum, child) => sum + (child.stock || 0),
                  0,
                ),
            photos: [],
            status: 'pending_variation_review',
            productType: 'variable',
            isNewImport: true,
            importedAt: now,
            lastImportId: run.id,
            reservedStock: 0,
            lowStockThreshold: 2,
          }),
        );
        added += 1;
      } else {
        if (parent.status === 'rejected') continue;
        parent.productType = 'variable';
        if (!preserveInventory) {
          parent.stock = group.children.reduce(
            (sum, child) => sum + (child.stock || 0),
            0,
          );
        }
        await this.products.save(parent);
      }
    }

    run.changeSet = changeSet;
    run.status = 'completed';
    await this.runs.save(run);

    await this.audit.record({
      action: 'import.completed',
      entityType: 'import_run',
      entityId: run.id,
      importId: run.id,
      actor,
      newValue: { added, updated, skipped },
      source: run.fileName,
    });

    return { added, updated, skipped, importId: run.id };
  }

  private async upsertVariation(
    parentProduct: ProductEntity,
    row: CommitRow,
    importId: string,
    changeSet: { variations: string[] },
    preserveInventory = false,
  ): Promise<void> {
    const barcode = normalizeProductCode(row.barcode || row.code);
    const sku = normalizeProductCode(row.code);
    let variation = await this.variations.findOne({
      where: [{ barcode }, { sku }],
    });

    if (!variation) {
      variation = this.variations.create({
        parentProductId: parentProduct.id,
        parentCode: normalizeProductCode(row.parentCode || parentProduct.code),
        sku,
        barcode,
        size: normalizeSizeValue(row.size),
        color: normalizeColorValue(row.color).canonical || row.color,
        material: row.material,
        price: row.price,
        stock: preserveInventory ? 0 : row.stock,
        reservedStock: 0,
        available: preserveInventory ? false : row.stock > 0,
        photos: [],
        status: 'draft',
        importId,
      });
    } else {
      // Idempotent update — same barcode under two parents is blocked upstream
      if (
        variation.parentCode !==
        normalizeProductCode(row.parentCode || parentProduct.code)
      ) {
        // Legacy catalog metadata must never re-parent an authoritative
        // warehouse variation. Skip the conflicting legacy relation while
        // continuing the rest of the enrichment job.
        if (preserveInventory) return;
        throw new Error(`barcode_parent_conflict:${barcode}`);
      }
      if (!preserveInventory) variation.stock = row.stock;
      if (!preserveInventory) variation.price = row.price ?? variation.price;
      variation.size = normalizeSizeValue(row.size) ?? variation.size;
      variation.color =
        normalizeColorValue(row.color).canonical ||
        row.color ||
        variation.color;
      if (!preserveInventory) variation.available = row.stock > 0;
      variation.importId = importId;
    }

    variation = await this.variations.save(variation);
    changeSet.variations.push(variation.id);
  }

  private mergeLegacyPhotos(
    current: ProductEntity['photos'] | null | undefined,
    imageUrls: string[],
    addedAt: string,
  ): ProductEntity['photos'] {
    const photos = [...(current || [])];
    const known = new Set(photos.map((photo) => photo.url));
    for (const url of imageUrls) {
      if (known.has(url) || photos.length >= 5) continue;
      let fileName = 'legacy-product-image.jpg';
      try {
        const pathPart = new URL(url).pathname.split('/').filter(Boolean).pop();
        if (pathPart) fileName = decodeURIComponent(pathPart);
      } catch {
        // URL validity is already checked during Dry Run.
      }
      photos.push({
        url,
        fileName,
        addedAt,
        role: photos.length === 0 ? 'primary' : 'gallery',
      });
      known.add(url);
    }
    return photos;
  }

  private async ensureCategoryDefaultTag(
    product: ProductEntity,
    categorySlug: string,
    evidence: string,
  ): Promise<void> {
    const tagValue = `Category:${categorySlug || 'unconventional'}`;
    const existing = await this.productTags.findOne({
      where: { productId: product.id, tagValue },
    });
    if (existing) return;
    await this.productTags.save(
      this.productTags.create({
        productId: product.id,
        tagValue,
        confidence: 1,
        evidence: [`category_classifier:${evidence}`],
        ruleOrModel: 'category.default',
        approvalState: 'auto_approved',
        taggedAt: new Date().toISOString(),
      }),
    );
  }

  async rollback(input: {
    importId: string;
    actor?: string | null;
    productCodes?: string[];
  }): Promise<{ restored: number; detachedVariations: number }> {
    const run = await this.runs.findOne({ where: { id: input.importId } });
    if (!run) throw new NotFoundException('import_not_found');
    if (!run.changeSet) throw new BadRequestException('no_changeset');

    const changeSet = run.changeSet as {
      products: Array<{
        code: string;
        previous: Partial<ProductEntity> | null;
      }>;
      variations: string[];
    };

    let restored = 0;
    const filter = input.productCodes?.map(normalizeProductCode);

    for (const item of changeSet.products || []) {
      if (filter && !filter.includes(normalizeProductCode(item.code))) continue;
      const product = await this.products.findOne({
        where: { code: normalizeProductCode(item.code) },
      });
      if (!product) continue;

      if (item.previous == null) {
        await this.products.delete({ id: product.id });
      } else {
        Object.assign(product, item.previous);
        await this.products.save(product);
      }
      restored += 1;
    }

    let detachedVariations = 0;
    if (changeSet.variations?.length) {
      const ids = filter
        ? await this.variations.find({ where: { importId: run.id } })
        : await this.variations.find({
            where: { id: In(changeSet.variations) },
          });
      for (const v of ids) {
        await this.variations.delete({ id: v.id });
        detachedVariations += 1;
      }
    }

    run.status = 'rolled_back';
    await this.runs.save(run);

    await this.audit.record({
      action: 'import.rollback',
      entityType: 'import_run',
      entityId: run.id,
      importId: run.id,
      actor: input.actor,
      newValue: { restored, detachedVariations },
    });

    return { restored, detachedVariations };
  }

  async saveMappingTemplate(input: {
    name: string;
    mapping: ColumnMapping;
    headerFingerprint: string;
    actor?: string | null;
  }): Promise<MappingTemplateEntity> {
    let row = await this.templates.findOne({
      where: { headerFingerprint: input.headerFingerprint },
    });
    if (!row) {
      row = this.templates.create({
        name: input.name,
        mapping: input.mapping as Record<string, string>,
        headerFingerprint: input.headerFingerprint,
        createdBy: input.actor ?? null,
      });
    } else {
      row.name = input.name;
      row.mapping = input.mapping;
    }
    row = await this.templates.save(row);
    await this.audit.record({
      action: 'mapping.template_saved',
      entityType: 'mapping_template',
      entityId: row.id,
      actor: input.actor,
      newValue: { name: row.name },
    });
    return row;
  }

  listRuns(limit = 50): Promise<ImportRunEntity[]> {
    return this.runs.find({
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 200),
    });
  }

  async getRun(id: string): Promise<ImportRunEntity> {
    const run = await this.runs.findOne({ where: { id } });
    if (!run) throw new NotFoundException('import_not_found');
    return run;
  }

  listTemplates(): Promise<MappingTemplateEntity[]> {
    return this.templates.find({ order: { updatedAt: 'DESC' } });
  }
}
