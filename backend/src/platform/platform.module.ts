import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from '../products/entities/product.entity';
import { AuditService } from './audit/audit.service';
import { ImportService } from './import/import.service';
import { ImportTransactionBoundaryService } from './import/import-transaction-boundary.service';
import { JobsService } from './jobs/jobs.service';
import { MediaReconciliationController } from './media/media-reconciliation.controller';
import { MediaSecurityService } from './media/media-security.service';
import { MediaStorageService } from './media/media-storage.service';
import { MediaService } from './media/media.service';
import { MerchandisingService } from './merchandising/merchandising.service';
import {
  PlatformController,
  PlatformPublicController,
} from './platform.controller';
import { PLATFORM_ENTITIES } from './platform.entities';
import { WorkflowService } from './workflow/workflow.service';

export { PLATFORM_ENTITIES } from './platform.entities';

@Module({
  imports: [TypeOrmModule.forFeature([...PLATFORM_ENTITIES, ProductEntity])],
  controllers: [
    PlatformController,
    PlatformPublicController,
    MediaReconciliationController,
  ],
  providers: [
    AuditService,
    JobsService,
    ImportService,
    ImportTransactionBoundaryService,
    MediaSecurityService,
    MediaStorageService,
    MediaService,
    MerchandisingService,
    WorkflowService,
  ],
  exports: [
    AuditService,
    JobsService,
    ImportService,
    MediaSecurityService,
    MediaStorageService,
    MediaService,
    MerchandisingService,
    WorkflowService,
  ],
})
export class PlatformModule {}
