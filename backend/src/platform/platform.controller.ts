import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { AuditService } from './audit/audit.service';
import { ColumnMapping } from './import/column-mapper';
import { ImportService } from './import/import.service';
import { JobsService } from './jobs/jobs.service';
import { MediaService } from './media/media.service';
import { MerchandisingService } from './merchandising/merchandising.service';
import { WorkflowService } from './workflow/workflow.service';
import { ConfigService } from '@nestjs/config';
import { getPublicBackendUrl } from '../config/public-url';
import { Throttle } from '@nestjs/throttler';

type MulterFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

interface RequestLike {
  protocol: string;
  get(header: string): string | undefined;
  user?: { email?: string; sub?: string };
}

@Controller('platform')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class PlatformController {
  constructor(
    private readonly imports: ImportService,
    private readonly media: MediaService,
    private readonly merch: MerchandisingService,
    private readonly jobs: JobsService,
    private readonly audit: AuditService,
    private readonly workflow: WorkflowService,
    private readonly config: ConfigService,
  ) {}

  // —— Import ——
  @Post('import/dry-run')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 40 * 1024 * 1024 },
    }),
  )
  async dryRun(
    @UploadedFile() file: MulterFile,
    @Body()
    body: {
      mappingJson?: string;
      confirmUncertainMapping?: string;
      sourceTimestamp?: string;
    },
    @Req() req: RequestLike,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('file_required');
    }
    let mapping: ColumnMapping | undefined;
    if (body.mappingJson) {
      try {
        mapping = JSON.parse(body.mappingJson);
      } catch {
        throw new BadRequestException('invalid_mapping_json');
      }
    }
    return this.imports.dryRun({
      buffer: file.buffer,
      fileName: file.originalname,
      mapping,
      confirmUncertainMapping: body.confirmUncertainMapping === 'true',
      sourceTimestamp: body.sourceTimestamp || null,
      actor: req.user?.email || null,
    });
  }

  @Post('import/:id/confirm')
  confirm(
    @Param('id') id: string,
    @Body() body: { inventoryStrategy?: 'full_replace' | 'incremental' },
    @Req() req: RequestLike,
  ) {
    return this.imports.confirmImport({
      importId: id,
      actor: req.user?.email || null,
      inventoryStrategy: body.inventoryStrategy,
    });
  }

  @Post('import/:id/rollback')
  rollback(
    @Param('id') id: string,
    @Body() body: { productCodes?: string[] },
    @Req() req: RequestLike,
  ) {
    return this.imports.rollback({
      importId: id,
      actor: req.user?.email || null,
      productCodes: body.productCodes,
    });
  }

  @Get('import/runs')
  listRuns(@Query('limit') limit?: string) {
    return this.imports.listRuns(limit ? Number(limit) : 50);
  }

  @Get('import/runs/:id')
  getRun(@Param('id') id: string) {
    return this.imports.getRun(id);
  }

  @Get('import/templates')
  templates() {
    return this.imports.listTemplates();
  }

  @Post('import/templates')
  saveTemplate(
    @Body()
    body: {
      name: string;
      mapping: ColumnMapping;
      headerFingerprint: string;
    },
    @Req() req: RequestLike,
  ) {
    return this.imports.saveMappingTemplate({
      ...body,
      actor: req.user?.email || null,
    });
  }

  // —— Media ——
  @Post('media/upload')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseInterceptors(
    FilesInterceptor('files', 200, {
      storage: memoryStorage(),
      limits: { fileSize: 12 * 1024 * 1024 },
    }),
  )
  uploadMedia(
    @UploadedFiles() files: MulterFile[],
    @Body() body: { confirmPrimarySuggestions?: string },
    @Req() req: RequestLike,
  ) {
    if (!files?.length) throw new BadRequestException('files_required');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.media.ingestFiles({
      files: files.map((f) => ({
        originalName: f.originalname,
        buffer: f.buffer,
      })),
      uploadsBaseUrl: baseUrl,
      actor: req.user?.email || null,
      confirmPrimarySuggestions: body.confirmPrimarySuggestions === 'true',
    });
  }

  @Post('media/upload-zip')
  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 200 * 1024 * 1024 },
    }),
  )
  uploadZip(
    @UploadedFile() file: MulterFile,
    @Body()
    body: {
      confirmPrimarySuggestions?: string;
      confirmedPublishedCodes?: string;
    },
    @Req() req: RequestLike,
  ) {
    if (!file?.buffer?.length) throw new BadRequestException('file_required');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.media.ingestZip({
      buffer: file.buffer,
      uploadsBaseUrl: baseUrl,
      actor: req.user?.email || null,
      confirmPrimarySuggestions: body.confirmPrimarySuggestions === 'true',
      confirmedPublishedCodes: (() => {
        try {
          const parsed = JSON.parse(body.confirmedPublishedCodes || '[]');
          return Array.isArray(parsed) ? parsed.map(String) : [];
        } catch {
          return [];
        }
      })(),
    });
  }

  @Post('media/inspect-zip')
  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 200 * 1024 * 1024 },
    }),
  )
  inspectZip(@UploadedFile() file: MulterFile) {
    if (!file?.buffer?.length) throw new BadRequestException('file_required');
    return this.media.inspectZip(file.buffer);
  }

  @Get('media/orphans')
  orphans() {
    return this.media.listOrphans();
  }

  @Get('media/quarantine')
  quarantine() {
    return this.media.listQuarantine();
  }

  @Post('media/reattach-orphans')
  reattach(@Req() req: RequestLike) {
    return this.media.reattachOrphans(req.user?.email || null);
  }

  @Get('media/report')
  mediaReport() {
    return this.media.mediaHealthReport();
  }

  @Get('media/missing')
  mediaMissing(@Query('limit') limit?: string) {
    return this.media.listProductsMissingImages(limit ? Number(limit) : 200);
  }

  @Get('inventory/summary')
  inventorySummary() {
    return this.merch.inventorySummary();
  }

  @Post('collections/auto-generate')
  autoCollections(@Req() req: RequestLike) {
    return this.merch.autoGenerateCollections(req.user?.email || null);
  }

  @Get('widgets')
  widgets() {
    return this.merch.listPsychologyWidgets();
  }

  // —— Jobs / Audit ——
  @Get('jobs')
  jobsList() {
    return this.jobs.list();
  }

  @Get('jobs/:id')
  jobGet(@Param('id') id: string) {
    return this.jobs.get(id);
  }

  @Post('jobs/:id/cancel')
  jobCancel(@Param('id') id: string) {
    return this.jobs.cancel(id);
  }

  @Get('audit')
  auditList(@Query('limit') limit?: string) {
    return this.audit.list(limit ? Number(limit) : 100);
  }

  // —— Workflow ——
  @Get('workflow/queue')
  workflowQueue(@Query('status') status?: string) {
    return this.workflow.listQueue(status);
  }

  @Post('workflow/approve')
  approve(
    @Body()
    body: { productIds: string[]; publish?: boolean; scheduleAt?: string },
    @Req() req: RequestLike,
  ) {
    return this.workflow.approveMany({
      productIds: body.productIds || [],
      publish: !!body.publish,
      scheduleAt: body.scheduleAt,
      actor: req.user?.email || null,
    });
  }

  @Post('workflow/reject')
  reject(
    @Body() body: { productIds: string[]; reason: string },
    @Req() req: RequestLike,
  ) {
    return this.workflow.rejectMany({
      productIds: body.productIds || [],
      reason: body.reason || 'rejected',
      actor: req.user?.email || null,
    });
  }

  @Get('workflow/compare/:id')
  compare(@Param('id') id: string) {
    return this.workflow.compare(id);
  }

  // —— Merchandising ——
  @Get('rules')
  rules() {
    return this.merch.listRules();
  }

  @Post('rules')
  saveRule(@Body() body: Record<string, unknown>, @Req() req: RequestLike) {
    return this.merch.saveRule(body as never, req.user?.email || null);
  }

  @Get('rules/simulate/:productCode')
  simulate(@Param('productCode') productCode: string) {
    return this.merch.simulate(productCode);
  }

  @Get('recommendations/:productCode')
  recommendations(
    @Param('productCode') productCode: string,
    @Query('widget') widget?: string,
  ) {
    return this.merch.recommendationsFor(productCode, widget);
  }

  @Post('recommendations/events')
  track(@Body() body: Record<string, unknown>) {
    return this.merch.trackEvent(body as never);
  }

  @Get('recommendations/analytics')
  analytics() {
    return this.merch.analytics();
  }

  @Get('taxonomy')
  taxonomy() {
    return this.merch.listTaxonomy();
  }

  @Post('taxonomy')
  upsertTaxonomy(
    @Body() body: Record<string, unknown>,
    @Req() req: RequestLike,
  ) {
    return this.merch.upsertTaxonomyTag({
      canonicalValue: String(body['canonicalValue'] ?? ''),
      aliases: Array.isArray(body['aliases'])
        ? (body['aliases'] as string[])
        : undefined,
      parentTagId: (body['parentTagId'] as string | null | undefined) ?? null,
      enabled: body['enabled'] as boolean | undefined,
      publicDisplay: body['publicDisplay'] as boolean | undefined,
      actor: req.user?.email || null,
    });
  }

  @Post('taxonomy/merge')
  mergeTags(
    @Body() body: { from: string; to: string },
    @Req() req: RequestLike,
  ) {
    return this.merch.mergeTags(body.from, body.to, req.user?.email || null);
  }

  @Get('tags/pending')
  pendingTags() {
    return this.merch.pendingTags();
  }

  @Post('tags/:id/approve')
  approveTag(@Param('id') id: string, @Req() req: RequestLike) {
    return this.merch.approveTag(id, req.user?.email || null);
  }

  @Get('looks')
  looks() {
    return this.merch.listLooks();
  }

  @Post('looks')
  saveLook(@Body() body: Record<string, unknown>, @Req() req: RequestLike) {
    const baseUrl = getPublicBackendUrl(this.config);
    return this.merch.saveLook(body as never, req.user?.email || null, baseUrl);
  }

  @Get('attributes')
  attributes() {
    return this.merch.listAttributes();
  }

  @Post('attributes')
  upsertAttribute(@Body() body: Record<string, unknown>) {
    return this.merch.upsertAttribute(body as never);
  }
}

/** Public recommendation widget endpoint — published products only scored server-side */
@Controller('platform/public')
export class PlatformPublicController {
  constructor(private readonly merch: MerchandisingService) {}

  @Get('recommendations/:productCode')
  recommendations(
    @Param('productCode') productCode: string,
    @Query('widget') widget?: string,
  ) {
    return this.merch.recommendationsFor(productCode, widget);
  }

  @Get('looks')
  looks() {
    return this.merch.publicLooks();
  }

  @Get('looks/:id')
  look(@Param('id') id: string) {
    return this.merch.publicLook(id);
  }
}
