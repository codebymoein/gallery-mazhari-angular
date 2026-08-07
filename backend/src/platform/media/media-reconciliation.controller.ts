import { Controller, Get, UseGuards } from '@nestjs/common';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../users/entities/user.entity';
import { MediaService } from './media.service';

@Controller('platform/media')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class MediaReconciliationController {
  constructor(private readonly media: MediaService) {}

  @Get('reconciliation')
  @Permissions('media.manage')
  reconciliation() {
    return this.media.reconciliationReport();
  }
}
