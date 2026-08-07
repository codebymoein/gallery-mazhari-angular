import { AuditLogEntity } from './audit/entities/audit-log.entity';
import {
  ImportRunEntity,
  MappingTemplateEntity,
} from './import/entities/import-run.entity';
import { ProductVariationEntity } from './import/entities/product-variation.entity';
import { PlatformJobEntity } from './jobs/entities/platform-job.entity';
import {
  InventoryAuditEntity,
  MediaAssetEntity,
} from './media/entities/media-asset.entity';
import {
  AttributeValueEntity,
  CuratedLookEntity,
  MerchRuleEntity,
  ProductTagEntity,
  RecommendationEventEntity,
  TaxonomyTagEntity,
} from './taxonomy/entities/taxonomy.entities';

export const PLATFORM_ENTITIES = [
  PlatformJobEntity,
  AuditLogEntity,
  ImportRunEntity,
  MappingTemplateEntity,
  ProductVariationEntity,
  MediaAssetEntity,
  InventoryAuditEntity,
  TaxonomyTagEntity,
  ProductTagEntity,
  AttributeValueEntity,
  MerchRuleEntity,
  CuratedLookEntity,
  RecommendationEventEntity,
];
