import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { CustomRequestsController } from './custom-requests.controller';
import { CustomRequestsService } from './custom-requests.service';
import { CustomRequestEntity } from './entities/custom-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CustomRequestEntity]), NotificationsModule],
  controllers: [CustomRequestsController],
  providers: [CustomRequestsService],
})
export class CustomRequestsModule {}
