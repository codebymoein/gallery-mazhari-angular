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
import { UserRole } from '../users/entities/user.entity';
import { AttachPhotosDto } from './dto/attach-photos.dto';
import { ImportProductsDto } from './dto/import-products.dto';
import { OverrideStatusDto, PublishProductDto } from './dto/publish-product.dto';
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
  @Roles(UserRole.ADMIN)
  queue() {
    return this.productsService.getQueue();
  }

  @Post('import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  applyImport(@Body() dto: ImportProductsDto) {
    return this.productsService.applyImport(dto);
  }

  @Post(':id/photos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
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
  @Roles(UserRole.ADMIN)
  removePhoto(
    @Param('id') id: string,
    @Param('index', ParseIntPipe) index: number,
  ) {
    return this.productsService.removePhoto(id, index);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  publish(@Param('id') id: string, @Body() dto: PublishProductDto) {
    return this.productsService.publish(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  overrideStatus(@Param('id') id: string, @Body() dto: OverrideStatusDto) {
    return this.productsService.overrideStatus(id, dto);
  }
}
