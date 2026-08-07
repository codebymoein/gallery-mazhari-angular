import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import {
  ProductEntity,
  ProductStatus,
} from '../../products/entities/product.entity';
import { assertPlatformTransition } from '../../products/product-workflow.policy';
import { AuditService } from '../audit/audit.service';
import { ImportRunEntity } from '../import/entities/import-run.entity';

const REVIEW_STATUSES: ProductStatus[] = [
  'draft',
  'pending_data_review',
  'pending_variation_review',
  'pending_image_review',
  'enrichment_pending',
  'media_pending',
  'ready_for_approval',
  'waiting_photo',
  'approved',
];

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
    @InjectRepository(ImportRunEntity)
    private readonly imports: Repository<ImportRunEntity>,
    private readonly audit: AuditService,
  ) {}

  async listQueue(status?: string): Promise<ProductEntity[]> {
    if (status) {
      return this.products.find({
        where: { status: status as ProductStatus },
        order: { updatedAt: 'DESC' },
        take: 500,
      });
    }
    return this.products.find({
      where: {
        status: In(REVIEW_STATUSES),
      } as FindOptionsWhere<ProductEntity>,
      order: { updatedAt: 'DESC' },
      take: 500,
    });
  }

  async approveMany(input: {
    productIds: string[];
    publish?: boolean;
    scheduleAt?: string;
    actor?: string | null;
  }): Promise<{ approved: number; published: number }> {
    if (!input.productIds?.length) {
      throw new BadRequestException('productIds_required');
    }
    const products = await this.products.find({
      where: { id: In(input.productIds) },
    });

    // Validate the entire batch before the first write so an invalid product
    // cannot leave a partially advanced workflow batch.
    for (const product of products) {
      assertPlatformTransition(product.status, 'approved');
      if (input.publish) {
        assertPlatformTransition(
          'approved',
          product.photos?.length ? 'published' : 'pending_image_review',
        );
      }
    }

    let approved = 0;
    let published = 0;
    const now = new Date().toISOString();

    for (const p of products) {
      const prev = p.status;
      p.status = 'approved';
      p.rejectionReason = null;
      if (input.scheduleAt) {
        p.scheduledPublishAt = input.scheduleAt;
      }
      if (input.publish) {
        if (!p.photos?.length) {
          p.status = 'pending_image_review';
          p.notes = 'انتشار بدون تصویر مجاز نیست';
        } else {
          p.status = 'published';
          p.publishedAt = now;
          p.publishedBy = input.actor ?? null;
          published += 1;
        }
      }
      await this.products.save(p);
      approved += 1;
      await this.audit.record({
        action: input.publish ? 'product.published' : 'product.approved',
        entityType: 'product',
        entityId: p.id,
        actor: input.actor,
        previousValue: { status: prev },
        newValue: { status: p.status },
      });
    }
    return { approved, published };
  }

  async rejectMany(input: {
    productIds: string[];
    reason: string;
    actor?: string | null;
  }): Promise<{ rejected: number }> {
    const products = await this.products.find({
      where: { id: In(input.productIds) },
    });
    for (const product of products) {
      assertPlatformTransition(product.status, 'rejected');
    }
    for (const p of products) {
      const prev = p.status;
      p.status = 'rejected';
      p.rejectionReason = input.reason;
      await this.products.save(p);
      await this.audit.record({
        action: 'product.rejected',
        entityType: 'product',
        entityId: p.id,
        actor: input.actor,
        previousValue: { status: prev },
        newValue: { status: 'rejected', reason: input.reason },
      });
    }
    return { rejected: products.length };
  }

  async compare(productId: string): Promise<{
    current: ProductEntity;
    previousFromImport: unknown;
  }> {
    const product = await this.products.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('product_not_found');

    let previousFromImport: unknown = null;
    if (product.lastImportId) {
      const run = await this.imports.findOne({
        where: { id: product.lastImportId },
      });
      const changeSet = run?.changeSet as {
        products?: Array<{ code: string; previous: unknown }>;
      } | null;
      previousFromImport =
        changeSet?.products?.find((p) => p.code === product.code)?.previous ??
        null;
    }

    return { current: product, previousFromImport };
  }
}
