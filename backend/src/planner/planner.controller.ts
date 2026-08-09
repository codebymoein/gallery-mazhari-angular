import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { DeletePlannerDto, UpdatePlannerTaskDto, UpsertPlannerDto } from './dto/planner.dto';
import { PlannerService } from './planner.service';

type CustomerRequest = { user: { userId: string; role: UserRole } };

@Controller('planner')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class PlannerController {
  constructor(private readonly planner: PlannerService) {}

  @Get('me')
  getMine(@Request() req: CustomerRequest) {
    return this.planner.getMine(req.user.userId);
  }

  @Put('me')
  upsert(@Request() req: CustomerRequest, @Body() dto: UpsertPlannerDto) {
    return this.planner.upsert(req.user.userId, dto);
  }

  @Patch('me/tasks/:taskId')
  updateTask(
    @Request() req: CustomerRequest,
    @Param('taskId') taskId: string,
    @Body() dto: UpdatePlannerTaskDto,
  ) {
    return this.planner.updateTask(req.user.userId, taskId, dto);
  }

  @Delete('me')
  remove(@Request() req: CustomerRequest, @Body() dto: DeletePlannerDto) {
    return this.planner.remove(req.user.userId, dto);
  }
}
