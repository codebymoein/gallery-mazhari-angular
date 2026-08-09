import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeddingPlannerEntity } from './entities/wedding-planner.entity';
import { PlannerController } from './planner.controller';
import { PlannerService } from './planner.service';

@Module({
  imports: [TypeOrmModule.forFeature([WeddingPlannerEntity])],
  controllers: [PlannerController],
  providers: [PlannerService],
})
export class PlannerModule {}
