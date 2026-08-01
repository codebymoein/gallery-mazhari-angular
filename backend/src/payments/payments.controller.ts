import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { CreatePaymentDto, UpdatePaymentSettingsDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';
import { getPublicBackendUrl } from '../config/public-url';
import { Throttle } from '@nestjs/throttler';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly service: PaymentsService,
    private readonly config: ConfigService,
  ) {}

  @Get('settings/public')
  publicSettings() {
    return this.service.publicSettings();
  }

  @Get('settings')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Permissions('marketing.manage')
  adminSettings() {
    return this.service.adminSettings();
  }

  @Put('settings')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Permissions('marketing.manage')
  updateSettings(@Body() dto: UpdatePaymentSettingsDto) {
    return this.service.updateSettings(dto);
  }

  @Post('create')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  create(@Body() dto: CreatePaymentDto) {
    return this.service.createPayment(dto, getPublicBackendUrl(this.config));
  }

  @Get('callback/:id')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async callback(
    @Param('id') id: string,
    @Query() query: Record<string, string | undefined>,
    @Res() response: Response,
  ) {
    const tx = await this.service.callback(id, query);
    const origin = (process.env.FRONTEND_ORIGIN || 'http://localhost:4200')
      .split(',')[0]
      .trim();
    const params = new URLSearchParams({
      payment: tx.status,
      order: tx.orderNumber,
      ref: tx.referenceId || '',
    });
    return response.redirect(`${origin}/checkout?${params.toString()}`);
  }
}
