import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { VERSION_APP } from './config/version';
import { Public } from './modules/auth/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Estado de la API, versión desplegada y conexión a PostgreSQL',
  })
  async check(): Promise<{
    status: string;
    version: string;
    db: string;
    timestamp: string;
  }> {
    let db = 'ok';
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      db = 'error';
    }
    return {
      status: 'ok',
      version: VERSION_APP,
      db,
      timestamp: new Date().toISOString(),
    };
  }
}
