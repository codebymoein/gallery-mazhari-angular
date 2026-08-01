import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'platform_taxonomy_tags' })
export class TaxonomyTagEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ length: 160 })
  canonicalValue: string;

  @Column({ type: 'simple-json', default: '[]' })
  aliases: string[];

  @Column({ type: 'varchar', length: 80, nullable: true })
  parentTagId: string | null;

  @Column({ default: true })
  enabled: boolean;

  @Column({ default: false })
  publicDisplay: boolean;

  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity({ name: 'platform_product_tags' })
export class ProductTagEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 80 })
  productId: string;

  @Index()
  @Column({ length: 160 })
  tagValue: string;

  @Column({ type: 'float' })
  confidence: number;

  @Column({ type: 'simple-json' })
  evidence: string[];

  @Column({ length: 120 })
  ruleOrModel: string;

  @Column({ length: 30, default: 'suggested' })
  approvalState: string;

  @Column({ type: 'varchar', length: 40 })
  taggedAt: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity({ name: 'platform_attribute_values' })
export class AttributeValueEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 40 })
  axis: string; // size | color | material | other

  @Index()
  @Column({ length: 120 })
  canonicalValue: string;

  @Column({ type: 'simple-json', default: '[]' })
  aliases: string[];

  @Column({ default: true })
  enabled: boolean;

  @Column({ default: false })
  approved: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity({ name: 'platform_merch_rules' })
export class MerchRuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 160 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ default: true })
  enabled: boolean;

  @Column({ type: 'int', default: 100 })
  priority: number;

  @Column({ type: 'float', default: 1 })
  weight: number;

  @Column({ type: 'varchar', length: 40, nullable: true })
  startDate: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  endDate: string | null;

  @Column({ type: 'simple-json' })
  conditions: unknown[];

  @Column({ type: 'simple-json' })
  actions: unknown[];

  @Column({ type: 'simple-json', nullable: true })
  targetPages: string[] | null;

  @Column({ type: 'simple-json', nullable: true })
  targetWidgets: string[] | null;

  @Column({ default: false })
  testMode: boolean;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'varchar', length: 120, nullable: true })
  createdBy: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  updatedBy: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity({ name: 'platform_curated_looks' })
export class CuratedLookEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  story: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  style: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  mood: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  ceremony: string | null;

  @Column({ type: 'varchar', length: 400, nullable: true })
  coverImageUrl: string | null;

  @Column({ type: 'varchar', length: 220, nullable: true })
  slug: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  subtitle: string | null;

  @Column({ type: 'simple-json', nullable: true })
  images: string[] | null;

  @Column({ type: 'simple-json', nullable: true })
  hotspots: Array<{
    imageIndex: number;
    productCode: string;
    x: number;
    y: number;
    label: string;
  }> | null;

  @Column({ type: 'simple-json' })
  productCodes: string[];

  @Column({ type: 'simple-json', nullable: true })
  alternatives: Record<string, string[]> | null;

  @Column({ length: 30, default: 'draft' })
  status: string;

  @Column({ type: 'int', default: 0 })
  displayPriority: number;

  @Column({ type: 'varchar', length: 40, nullable: true })
  publishStart: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  publishEnd: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity({ name: 'platform_reco_events' })
export class RecommendationEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 60 })
  eventType: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  sourceProductId: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  targetProductId: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  ruleId: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  widget: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  sessionKey: string | null;

  @Column({ type: 'simple-json', nullable: true })
  meta: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;
}
