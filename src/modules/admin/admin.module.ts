import {
  Controller,
  HttpCode,
  Injectable,
  Logger,
  Module,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { ApiErrores } from '../../common/dto/api-errores.decorator';
import {
  CurrentUser,
  UsuarioAutenticado,
} from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../usuarios/entities/usuario.entity';

export class ReinicioStockDto {
  @ApiProperty({ example: 75 })
  librosRepuestos: number;

  @ApiProperty({
    example: 3,
    description: 'Pedidos pendientes de pago que se cancelaron',
  })
  pedidosCancelados: number;
}

/**
 * Tareas de mantenimiento para la demo. El stock es compartido por Web,
 * Mobile y docentes, y cada pedido de prueba lo descuenta de verdad.
 */
@Injectable()
export class AdminService {
  private readonly logger = new Logger('Admin');

  constructor(private readonly dataSource: DataSource) {}

  /** Ejecuta scripts/reset-stock.sql (lo mismo que npm run db:reset-stock). */
  async reiniciarStock(admin: UsuarioAutenticado): Promise<ReinicioStockDto> {
    const sql = await readFile(
      join(process.cwd(), 'scripts', 'reset-stock.sql'),
      'utf8',
    );
    const [{ pendientes }] = await this.dataSource.query<
      { pendientes: number }[]
    >(
      `SELECT COUNT(*)::int AS pendientes FROM pedidos WHERE estado = 'PENDIENTE_PAGO'`,
    );
    // El script trae su propio BEGIN/COMMIT.
    await this.dataSource.query(sql);
    const [{ libros }] = await this.dataSource.query<{ libros: number }[]>(
      `SELECT COUNT(*)::int AS libros FROM libros
        WHERE id::text LIKE '00000000-0000-4000-8000-%'`,
    );
    this.logger.log(
      JSON.stringify({
        evento: 'stock_reiniciado',
        adminId: admin.id,
        librosRepuestos: libros,
        pedidosCancelados: pendientes,
      }),
    );
    return { librosRepuestos: libros, pedidosCancelados: pendientes };
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Post('reiniciar-stock')
  @HttpCode(200)
  @Roles(Rol.ADMIN)
  @ApiOperation({
    summary: 'Reponer el stock de los libros de prueba (solo ADMIN)',
    description:
      'Deja el stock como en los datos de prueba y cancela los pedidos pendientes de pago. ' +
      'No borra usuarios, pedidos pagados ni reseñas. Útil antes de una revisión.',
  })
  @ApiOkResponse({ type: ReinicioStockDto })
  @ApiErrores(401, 403)
  reiniciarStock(
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<ReinicioStockDto> {
    return this.admin.reiniciarStock(usuario);
  }
}

@Module({
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
