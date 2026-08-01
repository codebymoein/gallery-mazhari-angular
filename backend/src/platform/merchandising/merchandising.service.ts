import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { ProductEntity } from '../../products/entities/product.entity';
import {
  MerchRule,
  ProductContext,
  detectRuleConflicts,
  rankRecommendations,
} from '../rules/rule-engine';
import {
  CuratedLookEntity,
  MerchRuleEntity,
  ProductTagEntity,
  RecommendationEventEntity,
  TaxonomyTagEntity,
  AttributeValueEntity,
} from '../taxonomy/entities/taxonomy.entities';
import {
  resolveCanonicalTag,
  generateTagSuggestions,
} from '../taxonomy/tagging-engine';
import { matchProductsToCollections } from './collection-engine';
import { inventoryUrgencyLabel, PSYCHOLOGY_WIDGETS } from './similarity';

@Injectable()
export class MerchandisingService {
  constructor(
    @InjectRepository(MerchRuleEntity)
    private readonly rules: Repository<MerchRuleEntity>,
    @InjectRepository(CuratedLookEntity)
    private readonly looks: Repository<CuratedLookEntity>,
    @InjectRepository(TaxonomyTagEntity)
    private readonly taxonomy: Repository<TaxonomyTagEntity>,
    @InjectRepository(ProductTagEntity)
    private readonly productTags: Repository<ProductTagEntity>,
    @InjectRepository(AttributeValueEntity)
    private readonly attributes: Repository<AttributeValueEntity>,
    @InjectRepository(RecommendationEventEntity)
    private readonly events: Repository<RecommendationEventEntity>,
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
    private readonly audit: AuditService,
  ) {}

  listRules(): Promise<MerchRuleEntity[]> {
    return this.rules.find({ order: { priority: 'ASC' } });
  }

  async saveRule(
    body: Partial<MerchRuleEntity> & { name: string },
    actor?: string | null,
  ): Promise<{ rule: MerchRuleEntity; conflicts: string[] }> {
    let rule: MerchRuleEntity;
    if (body.id) {
      const existing = await this.rules.findOne({ where: { id: body.id } });
      if (!existing) throw new NotFoundException('rule_not_found');
      Object.assign(existing, body, {
        updatedBy: actor ?? existing.updatedBy,
        version: (existing.version || 1) + 1,
      });
      rule = existing;
    } else {
      rule = this.rules.create({
        name: body.name,
        description: body.description ?? null,
        enabled: body.enabled ?? true,
        priority: body.priority ?? 100,
        weight: body.weight ?? 1,
        startDate: body.startDate ?? null,
        endDate: body.endDate ?? null,
        conditions: body.conditions ?? [],
        actions: body.actions ?? [],
        targetPages: body.targetPages ?? null,
        targetWidgets: body.targetWidgets ?? null,
        testMode: body.testMode ?? false,
        version: 1,
        createdBy: actor ?? null,
        updatedBy: actor ?? null,
      });
    }

    const all = await this.listRules();
    const draft: MerchRule[] = [
      ...all.filter((r) => r.id !== rule.id).map((r) => this.toRule(r)),
      this.toRule(rule),
    ];
    const conflicts = detectRuleConflicts(draft);
    rule = await this.rules.save(rule);

    await this.audit.record({
      action: body.id ? 'rule.updated' : 'rule.created',
      entityType: 'merch_rule',
      entityId: rule.id,
      actor,
      newValue: { name: rule.name, version: rule.version },
      ruleVersion: String(rule.version),
    });

    return { rule, conflicts };
  }

  async simulate(
    productCode: string,
  ): Promise<ReturnType<typeof rankRecommendations>> {
    const sourceEntity = await this.products.findOne({
      where: { code: productCode },
    });
    if (!sourceEntity) throw new NotFoundException('product_not_found');

    // Prefer published / in-stock candidates for scoring performance at scale
    const catalog = await this.products.find({
      where: [{ status: 'published' }, { status: 'approved' }],
      take: 5000,
    });
    // Ensure source is in catalog set for context building
    if (!catalog.some((p) => p.id === sourceEntity.id)) {
      catalog.push(sourceEntity);
    }

    const tagMap = await this.loadTagsByProductIds([
      sourceEntity.id,
      ...catalog.map((p) => p.id),
    ]);
    const rules = (await this.listRules()).map((r) => this.toRule(r));

    return rankRecommendations(
      this.toContext(sourceEntity, tagMap.get(sourceEntity.id) || []),
      catalog.map((p) => this.toContext(p, tagMap.get(p.id) || [])),
      rules,
    );
  }

  async recommendationsFor(
    productCode: string,
    widget?: string,
  ): Promise<
    ReturnType<typeof rankRecommendations> & {
      widget: string;
      widgetLabel: string;
      recommendations: Array<
        ReturnType<typeof rankRecommendations>['recommendations'][number] & {
          urgencyLabel: string | null;
        }
      >;
    }
  > {
    const result = await this.simulate(productCode);
    const widgetKey = widget || 'complete_your_bridal_look';
    const meta =
      PSYCHOLOGY_WIDGETS[widgetKey] ||
      PSYCHOLOGY_WIDGETS.complete_your_bridal_look;

    let recommendations = result.recommendations.map((r) => ({
      ...r,
      urgencyLabel: inventoryUrgencyLabel(r.product.stock, 2),
    }));

    // Luxury widget: prefer luxury-tagged / high price candidates
    if (meta.emphasizeLuxury) {
      recommendations = [...recommendations].sort((a, b) => {
        const aLux = (a.product.tags || []).some((t) => /luxury/i.test(t))
          ? 1
          : 0;
        const bLux = (b.product.tags || []).some((t) => /luxury/i.test(t))
          ? 1
          : 0;
        return bLux - aLux || b.finalScore - a.finalScore;
      });
    }

    await this.events.save(
      this.events.create({
        eventType: 'recommendation_displayed',
        sourceProductId: productCode,
        targetProductId: null,
        ruleId: result.matchedRules[0]?.rule.id ?? null,
        widget: widgetKey,
        sessionKey: null,
        meta: {
          count: recommendations.length,
          ethicalLabelsOnly: true,
          widgetLabel: meta.labelFa,
        },
      }),
    );

    return {
      ...result,
      recommendations,
      widget: widgetKey,
      widgetLabel: meta.labelFa,
    };
  }

  async trackEvent(input: {
    eventType: string;
    sourceProductId?: string;
    targetProductId?: string;
    ruleId?: string;
    widget?: string;
    sessionKey?: string;
    meta?: Record<string, unknown>;
  }): Promise<RecommendationEventEntity> {
    return this.events.save(
      this.events.create({
        eventType: input.eventType,
        sourceProductId: input.sourceProductId ?? null,
        targetProductId: input.targetProductId ?? null,
        ruleId: input.ruleId ?? null,
        widget: input.widget ?? null,
        sessionKey: input.sessionKey ?? null,
        meta: input.meta ?? null,
      }),
    );
  }

  async analytics(): Promise<Record<string, number | string>> {
    const all = await this.events.find({
      take: 5000,
      order: { createdAt: 'DESC' },
    });
    const impressions = all.filter(
      (e) => e.eventType === 'recommendation_displayed',
    ).length;
    const clicks = all.filter(
      (e) => e.eventType === 'recommendation_clicked',
    ).length;
    const addToCart = all.filter(
      (e) => e.eventType === 'product_added_to_cart',
    ).length;
    const purchases = all.filter(
      (e) => e.eventType === 'purchase_completed',
    ).length;

    return {
      impressions,
      clicks,
      clickThroughRate: impressions ? clicks / impressions : 0,
      addToCart,
      addToCartRate: clicks ? addToCart / clicks : 0,
      purchases,
      conversionRate: impressions ? purchases / impressions : 0,
      note: 'Attribution is correlational unless order-level join is available',
    };
  }

  // —— Taxonomy ——
  listTaxonomy(): Promise<TaxonomyTagEntity[]> {
    return this.taxonomy.find({ order: { canonicalValue: 'ASC' } });
  }

  async upsertTaxonomyTag(input: {
    canonicalValue: string;
    aliases?: string[];
    parentTagId?: string | null;
    enabled?: boolean;
    publicDisplay?: boolean;
    actor?: string | null;
  }): Promise<TaxonomyTagEntity> {
    const canonical = resolveCanonicalTag(input.canonicalValue, {});
    let tag = await this.taxonomy.findOne({
      where: { canonicalValue: canonical },
    });
    if (!tag) {
      tag = this.taxonomy.create({
        canonicalValue: canonical,
        aliases: input.aliases ?? [],
        parentTagId: input.parentTagId ?? null,
        enabled: input.enabled ?? true,
        publicDisplay: input.publicDisplay ?? false,
        usageCount: 0,
      });
    } else {
      tag.aliases = [
        ...new Set([...(tag.aliases || []), ...(input.aliases || [])]),
      ];
      if (input.enabled != null) tag.enabled = input.enabled;
      if (input.publicDisplay != null) tag.publicDisplay = input.publicDisplay;
      if (input.parentTagId !== undefined) tag.parentTagId = input.parentTagId;
    }
    tag = await this.taxonomy.save(tag);
    await this.audit.record({
      action: 'taxonomy.upsert',
      entityType: 'taxonomy_tag',
      entityId: tag.id,
      actor: input.actor,
      newValue: { canonical: tag.canonicalValue },
    });
    return tag;
  }

  async mergeTags(
    fromValue: string,
    toValue: string,
    actor?: string | null,
  ): Promise<{ merged: number }> {
    const to = resolveCanonicalTag(toValue, {});
    const from = resolveCanonicalTag(fromValue, {});
    const tags = await this.productTags.find({ where: { tagValue: from } });
    let merged = 0;
    for (const t of tags) {
      t.tagValue = to;
      t.evidence = [...(t.evidence || []), `merged_from:${from}`];
      await this.productTags.save(t);
      merged += 1;
    }
    const taxFrom = await this.taxonomy.findOne({
      where: { canonicalValue: from },
    });
    let taxTo = await this.taxonomy.findOne({ where: { canonicalValue: to } });
    if (!taxTo) {
      taxTo = await this.upsertTaxonomyTag({ canonicalValue: to, actor });
    }
    if (taxFrom) {
      taxTo.aliases = [
        ...new Set([
          ...(taxTo.aliases || []),
          from,
          ...(taxFrom.aliases || []),
        ]),
      ];
      taxFrom.enabled = false;
      await this.taxonomy.save(taxFrom);
      await this.taxonomy.save(taxTo);
    }
    await this.audit.record({
      action: 'taxonomy.merge',
      actor,
      previousValue: { from },
      newValue: { to, merged },
    });
    return { merged };
  }

  pendingTags(): Promise<ProductTagEntity[]> {
    return this.productTags.find({
      where: [
        { approvalState: 'pending_review' },
        { approvalState: 'suggested' },
      ],
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  async approveTag(
    id: string,
    actor?: string | null,
  ): Promise<ProductTagEntity> {
    const tag = await this.productTags.findOne({ where: { id } });
    if (!tag) throw new NotFoundException('tag_not_found');
    tag.approvalState = 'approved';
    await this.productTags.save(tag);
    await this.audit.record({
      action: 'tag.approved',
      entityType: 'product_tag',
      entityId: id,
      actor,
    });
    return tag;
  }

  previewTagsForProduct(product: {
    name: string;
    category: string;
    description?: string;
    color?: string;
    material?: string;
  }) {
    return generateTagSuggestions(product);
  }

  // —— Curated looks ——
  listLooks(): Promise<CuratedLookEntity[]> {
    return this.looks.find({ order: { displayPriority: 'DESC' } });
  }

  async publicLooks(): Promise<
    Array<CuratedLookEntity & { products: ProductEntity[] }>
  > {
    const rows = await this.looks.find({
      where: { status: 'published' },
      order: { displayPriority: 'DESC' },
    });
    return Promise.all(
      rows.map(async (look) => ({
        ...look,
        products: look.productCodes?.length
          ? await this.products.find({
              where: {
                code: In(look.productCodes),
                status: In(['published', 'awaiting_stock']),
              },
            })
          : [],
      })),
    );
  }

  async publicLook(idOrSlug: string) {
    const look = await this.looks.findOne({
      where: [
        { id: idOrSlug, status: 'published' },
        { slug: idOrSlug, status: 'published' },
      ],
    });
    if (!look) throw new NotFoundException('look_not_found');
    const products = look.productCodes?.length
      ? await this.products.find({
          where: {
            code: In(look.productCodes),
            status: In(['published', 'awaiting_stock']),
          },
        })
      : [];
    return { ...look, products };
  }

  async saveLook(
    body: Partial<CuratedLookEntity> & { name: string; productCodes: string[] },
    actor?: string | null,
    baseUrl = '',
  ): Promise<CuratedLookEntity> {
    const images = (body.images ?? [])
      .slice(0, 5)
      .map((image, index) =>
        this.persistLookImage(image, `${body.id || 'new'}-${index}`, baseUrl),
      );
    if (body.coverImageUrl?.startsWith('data:')) {
      body.coverImageUrl = this.persistLookImage(
        body.coverImageUrl,
        `${body.id || 'new'}-cover`,
        baseUrl,
      );
    }
    body.images = images;
    let look: CuratedLookEntity;
    if (body.id) {
      const existing = await this.looks.findOne({ where: { id: body.id } });
      if (!existing) throw new NotFoundException('look_not_found');
      Object.assign(existing, body);
      look = existing;
    } else {
      look = this.looks.create({
        name: body.name,
        slug: body.slug ?? this.slugify(body.name),
        subtitle: body.subtitle ?? null,
        story: body.story ?? null,
        style: body.style ?? null,
        mood: body.mood ?? null,
        ceremony: body.ceremony ?? null,
        coverImageUrl: body.coverImageUrl ?? null,
        images: (body.images ?? []).slice(0, 5),
        hotspots: (body.hotspots ?? []).slice(0, 50),
        productCodes: body.productCodes,
        alternatives: body.alternatives ?? null,
        status: body.status ?? 'draft',
        displayPriority: body.displayPriority ?? 0,
        publishStart: body.publishStart ?? null,
        publishEnd: body.publishEnd ?? null,
      });
    }
    look = await this.looks.save(look);
    await this.audit.record({
      action: 'look.saved',
      entityType: 'curated_look',
      entityId: look.id,
      actor,
      newValue: { name: look.name, status: look.status },
    });
    return look;
  }

  private slugify(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\p{L}\p{N}-]/gu, '')
      .slice(0, 200);
  }

  private persistLookImage(
    value: string,
    key: string,
    baseUrl: string,
  ): string {
    if (!value?.startsWith('data:')) return String(value || '').slice(0, 500);
    const match = /^data:(image\/(?:jpeg|png|webp|avif));base64,(.+)$/i.exec(
      value,
    );
    if (!match) throw new BadRequestException('unsupported_look_image');
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 8 * 1024 * 1024)
      throw new BadRequestException('look_image_too_large');
    const ext: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/avif': 'avif',
    };
    const dir = join(process.cwd(), 'uploads', 'looks');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const name = `look-${key}-${Date.now()}.${ext[match[1].toLowerCase()]}`;
    writeFileSync(join(dir, name), buffer);
    return `${baseUrl}/uploads/looks/${name}`;
  }

  listAttributes(): Promise<AttributeValueEntity[]> {
    return this.attributes.find({
      order: { axis: 'ASC', canonicalValue: 'ASC' },
    });
  }

  async upsertAttribute(input: {
    axis: string;
    canonicalValue: string;
    aliases?: string[];
    approved?: boolean;
    enabled?: boolean;
  }): Promise<AttributeValueEntity> {
    let row = await this.attributes.findOne({
      where: { axis: input.axis, canonicalValue: input.canonicalValue },
    });
    if (!row) {
      row = this.attributes.create({
        axis: input.axis,
        canonicalValue: input.canonicalValue,
        aliases: input.aliases ?? [],
        approved: input.approved ?? false,
        enabled: input.enabled ?? true,
      });
    } else {
      row.aliases = [
        ...new Set([...(row.aliases || []), ...(input.aliases || [])]),
      ];
      if (input.approved != null) row.approved = input.approved;
      if (input.enabled != null) row.enabled = input.enabled;
    }
    return this.attributes.save(row);
  }

  /**
   * Auto-generate draft curated looks from hidden tag clusters.
   * Never auto-publishes collections.
   */
  async autoGenerateCollections(actor?: string | null): Promise<{
    created: number;
    updated: number;
    looks: CuratedLookEntity[];
  }> {
    const products = await this.products.find({ take: 10000 });
    const tagMap = await this.loadTagsByProductIds(products.map((p) => p.id));
    const tagged = products.map((p) => ({
      code: p.code,
      tags: tagMap.get(p.id) || [],
      status: p.status,
      stock: p.stock,
    }));

    const matched = matchProductsToCollections(tagged, undefined, {
      minProducts: 3,
    });
    let created = 0;
    let updated = 0;
    const looks: CuratedLookEntity[] = [];

    for (const m of matched) {
      const existing = (await this.looks.find()).find(
        (l) => l.name === m.name || l.ceremony === m.ceremony,
      );
      if (existing) {
        existing.productCodes = m.productCodes.slice(0, 48);
        existing.story = m.story;
        existing.style = m.style ?? existing.style;
        existing.mood = m.mood ?? existing.mood;
        existing.ceremony = m.ceremony ?? existing.ceremony;
        existing.displayPriority = m.displayPriority;
        if (existing.status === 'published') {
          // do not silently change published look membership without review flag
          existing.status = 'draft';
        }
        looks.push(await this.looks.save(existing));
        updated += 1;
      } else {
        const look = await this.looks.save(
          this.looks.create({
            name: m.name,
            story: m.story,
            style: m.style ?? null,
            mood: m.mood ?? null,
            ceremony: m.ceremony ?? null,
            coverImageUrl: null,
            productCodes: m.productCodes.slice(0, 48),
            alternatives: null,
            status: 'draft',
            displayPriority: m.displayPriority,
            publishStart: null,
            publishEnd: null,
          }),
        );
        looks.push(look);
        created += 1;
      }
    }

    await this.audit.record({
      action: 'collections.auto_generated',
      actor,
      newValue: { created, updated, names: looks.map((l) => l.name) },
    });

    return { created, updated, looks };
  }

  async inventorySummary(): Promise<Record<string, number>> {
    const products = await this.products.find({
      select: {
        id: true,
        stock: true,
        status: true,
        photos: true,
        lowStockThreshold: true,
        productType: true,
      },
    });
    const totalSkus = products.length;
    const totalUnits = products.reduce((n, p) => n + (p.stock || 0), 0);
    const oos = products.filter((p) => (p.stock || 0) <= 0).length;
    const lowStock = products.filter(
      (p) => p.stock > 0 && p.stock <= (p.lowStockThreshold ?? 2),
    ).length;
    const published = products.filter((p) => p.status === 'published').length;
    const missingImages = products.filter((p) => !p.photos?.length).length;
    const variableParents = products.filter(
      (p) => p.productType === 'variable',
    ).length;

    return {
      totalSkus,
      totalUnits,
      outOfStock: oos,
      lowStock,
      published,
      missingImages,
      variableParents,
      mediaCoveragePercent: totalSkus
        ? Math.round(((totalSkus - missingImages) / totalSkus) * 100)
        : 0,
    };
  }

  listPsychologyWidgets(): typeof PSYCHOLOGY_WIDGETS {
    return PSYCHOLOGY_WIDGETS;
  }

  /** Batch-load approved/auto tags — avoids N+1 during recommendation scoring */
  private async loadTagsByProductIds(
    productIds: string[],
  ): Promise<Map<string, string[]>> {
    const unique = [...new Set(productIds.filter(Boolean))];
    const map = new Map<string, string[]>();
    if (!unique.length) return map;

    // Chunk IN queries for large catalogs
    const chunkSize = 500;
    for (let i = 0; i < unique.length; i += chunkSize) {
      const chunk = unique.slice(i, i + chunkSize);
      const rows = await this.productTags.find({
        where: {
          productId: In(chunk),
          approvalState: In(['auto_approved', 'approved']),
        },
      });
      for (const row of rows) {
        const list = map.get(row.productId) || [];
        list.push(row.tagValue);
        map.set(row.productId, list);
      }
    }
    return map;
  }

  private toRule(entity: MerchRuleEntity): MerchRule {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description || undefined,
      enabled: entity.enabled,
      priority: entity.priority,
      weight: entity.weight,
      startDate: entity.startDate,
      endDate: entity.endDate,
      conditions: (entity.conditions || []) as MerchRule['conditions'],
      actions: (entity.actions || []) as MerchRule['actions'],
      targetPages: entity.targetPages || undefined,
      targetWidgets: entity.targetWidgets || undefined,
      testMode: entity.testMode,
    };
  }

  private toContext(p: ProductEntity, tags: string[] = []): ProductContext {
    const enrichment = (p.enrichment || {}) as Record<string, string>;
    return {
      id: p.id,
      code: p.code,
      category: p.category,
      subcategory: p.categorySlug,
      style: enrichment['style'],
      colorFamily: enrichment['colorFamily'] || p.color || undefined,
      ceremonyType: enrichment['ceremonyType'],
      price: p.price,
      stock: p.stock,
      status: p.status,
      tags,
      collection: p.collection || undefined,
      luxuryLevel: enrichment['luxuryLevel'],
      priceTier: enrichment['priceTier'],
      parentCode: p.parentCode,
      size: p.size,
      color: p.color,
      material: p.material,
      isNewArrival: p.isNewImport,
      isBestseller: enrichment['bestseller'] === 'true', // only when real flag set
      branch: p.branch,
    };
  }
}
