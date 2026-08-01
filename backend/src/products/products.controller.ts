import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AttachPhotosDto } from './dto/attach-photos.dto';
import { ImportProductsDto } from './dto/import-products.dto';
import {
  OverrideStatusDto,
  PublishProductDto,
} from './dto/publish-product.dto';
import { ProductsService } from './products.service';

interface RequestLike {
  protocol: string;
  get(header: string): string | undefined;
}

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /** ویترین عمومی — فقط محصولات منتشرشده و موجود */
  @Get('published')
  published() {
    return this.productsService.getPublished();
  }

  /** کل صف انتشار برای پنل ادمین */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  queue() {
    return this.productsService.getQueue();
  }

  @Post('import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  applyImport(@Body() dto: ImportProductsDto) {
    return this.productsService.applyImport(dto);
  }

  @Post('restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  restore(@Body() body: { products: Array<Record<string, unknown>> }) {
    return this.productsService.restoreProducts(body.products || []);
  }

  @Post(':id/photos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  attachPhotos(
    @Param('id') id: string,
    @Body() dto: AttachPhotosDto,
    @Req() req: RequestLike,
  ) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.productsService.attachPhotos(id, dto, baseUrl);
  }

  @Delete(':id/photos/:index')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  removePhoto(
    @Param('id') id: string,
    @Param('index', ParseIntPipe) index: number,
  ) {
    return this.productsService.removePhoto(id, index);
  }

  @Patch(':id/photos/:index/primary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  setPrimaryPhoto(
    @Param('id') id: string,
    @Param('index', ParseIntPipe) index: number,
  ) {
    return this.productsService.setPrimaryPhoto(id, index);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Permissions('publishing.queue.manage')
  publish(@Param('id') id: string, @Body() dto: PublishProductDto) {
    return this.productsService.publish(id, dto);
  }

  @Post(':id/unpublish')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Permissions('publishing.published.manage')
  unpublish(@Param('id') id: string, @Body() body: { actor?: string }) {
    return this.productsService.unpublish(id, body.actor);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  overrideStatus(@Param('id') id: string, @Body() dto: OverrideStatusDto) {
    return this.productsService.overrideStatus(id, dto);
  }

  @Patch(':id/catalog')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  updateCatalog(
    @Param('id') id: string,
    @Body()
    dto: {
      category: string;
      categorySlug: string;
      parentCategory: string;
      parentCategorySlug: string;
      collection?: string;
      hiddenTags?: string[];
    },
  ) {
    return this.productsService.updateCatalog(id, dto);
  }
}
