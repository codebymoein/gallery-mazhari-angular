import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { BulkProductDiscountDto } from './dto/bulk-product-discount.dto';
import {
  CreateDiscountRuleDto,
  UpdateDiscountRuleDto,
} from './dto/discount-rule.dto';
import { DiscountsService } from './discounts.service';

@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discounts: DiscountsService) {}

  @Get('products')
  products(@Query('home') home?: string) {
    return this.discounts.discountedProducts(home === 'true');
  }

  @Get('rules')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Permissions('marketing.manage')
  rules() {
    return this.discounts.listRules();
  }

  @Post('rules')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Permissions('marketing.manage')
  create(@Body() dto: CreateDiscountRuleDto) {
    return this.discounts.create(dto);
  }

  @Post('rules/bulk-products')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Permissions('marketing.manage')
  bulkProducts(@Body() dto: BulkProductDiscountDto) {
    return this.discounts.bulkProductDiscount(dto);
  }

  @Put('rules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Permissions('marketing.manage')
  update(@Param('id') id: string, @Body() dto: UpdateDiscountRuleDto) {
    return this.discounts.update(id, dto);
  }

  @Delete('rules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Permissions('marketing.manage')
  remove(@Param('id') id: string) {
    return this.discounts.remove(id);
  }
}
