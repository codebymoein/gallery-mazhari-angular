import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ObservabilityService } from './observability.service';

@Controller('ops')
export class ObservabilityController {
  constructor(private readonly observability: ObservabilityService) {}

  @Get('health/live')
  live() {
    return this.observability.live();
  }

  @Get('health/ready')
  async ready() {
    const result = await this.observability.ready();
    if (result.status !== 'ready') {
      throw new HttpException(result, HttpStatus.SERVICE_UNAVAILABLE);
    }
    return result;
  }

  @Get('version')
  version() {
    return this.observability.version();
  }

  @Get('metrics')
  metrics(@Res() response: Response) {
    response.type('text/plain; version=0.0.4');
    response.send(this.observability.metrics());
  }
}
