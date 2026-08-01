import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { AppearanceService } from './appearance.service';
import { UpdateAppearanceDto } from './dto/update-appearance.dto';

interface RequestLike {
  protocol: string;
  get(header: string): string | undefined;
}

@Controller('appearance')
export class AppearanceController {
  constructor(private readonly service: AppearanceService) {}

  @Get()
  get() {
    return this.service.get();
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Permissions('marketing.manage')
  update(@Body() dto: UpdateAppearanceDto, @Req() req: RequestLike) {
    return this.service.update(dto, `${req.protocol}://${req.get('host')}`);
  }
}
