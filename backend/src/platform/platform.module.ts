import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from '../products/entities/product.entity';
import { AuditLogEntity } from './audit/entities/audit-log.entity';
import { AuditService } from './audit/audit.service';
import {
  ImportRunEntity,
  MappingTemplateEntity,
} from './import/entities/import-run.entity';
import { ProductVariationEntity } from './import/entities/product-variation.entity';
import { ImportService } from './import/import.service';
import { PlatformJobEntity } from './jobs/entities/platform-job.entity';
import { JobsService } from './jobs/jobs.service';
import {
  InventoryAuditEntity,
  MediaAssetEntity,
} from './media/entities/media-asset.entity';
import { MediaService } from './media/media.service';
import { MerchandisingService } from './merchandising/merchandising.service';
import {
  PlatformController,
  PlatformPublicController,
} from './platform.controller';
import {
  AttributeValueEntity,
  CuratedLookEntity,
  MerchRuleEntity,
  ProductTagEntity,
  RecommendationEventEntity,
  TaxonomyTagEntity,
} from './taxonomy/entities/taxonomy.entities';
import { WorkflowService } from './workflow/workflow.service';

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

@Module({
  imports: [TypeOrmModule.forFeature([...PLATFORM_ENTITIES, ProductEntity])],
  controllers: [PlatformController, PlatformPublicController],
  providers: [
    AuditService,
    JobsService,
    ImportService,
    MediaService,
    MerchandisingService,
    WorkflowService,
  ],
  exports: [
    AuditService,
    JobsService,
    ImportService,
    MediaService,
    MerchandisingService,
    WorkflowService,
  ],
})
export class PlatformModule {}
