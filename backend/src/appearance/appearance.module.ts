import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppearanceController } from './appearance.controller';
import { AppearanceService } from './appearance.service';
import { SiteAppearanceEntity } from './entities/site-appearance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SiteAppearanceEntity])],
  controllers: [AppearanceController],
  providers: [AppearanceService],
})
export class AppearanceModule {}
