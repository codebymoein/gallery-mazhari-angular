import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { UpdateNotificationSettingsDto } from './dto/notification-settings.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}
  @Get('settings') settings() {
    return this.service.adminSettings();
  }
  @Put('settings') update(@Body() dto: UpdateNotificationSettingsDto) {
    return this.service.updateSettings(dto);
  }
  @Post('test/:channel') test(@Param('channel') channel: 'telegram' | 'sms') {
    return this.service.test(channel);
  }
}
