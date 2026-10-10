import {
  Controller,
  Get,
  Injectable,
  Module,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ApiErrores } from '../../common/dto/api-errores.decorator';
import { UuidPipe } from '../../common/pipes/uuid.pipe';
import { Public } from '../auth/decorators/public.decorator';
import { Libro } from '../libros/entities/libro.entity';
import { PedidosModule } from '../pedidos/pedidos.module';
import { PedidosService } from '../pedidos/pedidos.service';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { UsuariosService } from '../usuarios/usuarios.service';

export class GenerarRecomendacionesQueryDto {
  @ApiPropertyOptional({
    example: 5,
    default: 10,
    description: 'Cantidad máxima de recomendaciones a devolver',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limite?: number;
}

export class RecomendacionDto {
  @ApiProperty({ format: 'uuid' })
  libroId: string;

  @ApiProperty({ example: 'Fundación' })
  titulo: string;

  @ApiProperty({ example: 'Ciencia ficción' })
  genero: string;

  @ApiProperty({
    example: 0.6,
    description: '0.6 por género favorito + 0.4 por historial de compras',
  })
  score: number;

  @ApiProperty({ example: 'Coincide con tu género favorito "Ciencia ficción"' })
  motivo: string;
}

/**
 * Motor basado en reglas del Hito 1 (misma respuesta), ahora alimentado con
 * datos reales: géneros favoritos del usuario e historial de pedidos PAGADOS.
 */
@Injectable()
export class RecomendacionesService {
  constructor(
    @InjectRepository(Libro) private readonly libros: Repository<Libro>,
    private readonly usuarios: UsuariosService,
    private readonly pedidos: PedidosService,
  ) {}

  async paraUsuario(
    usuarioId: string,
    limite = 10,
  ): Promise<RecomendacionDto[]> {
    const usuario = await this.usuarios.obtener(usuarioId);
    const favoritos = new Set(
      usuario.generosFavoritos.map((g) => g.toLowerCase()),
    );

    const compradosIds = await this.pedidos.librosComprados(usuarioId);
    const comprados = compradosIds.length
      ? await this.libros.findBy({ id: In(compradosIds) })
      : [];
    const generosComprados = new Set(
      comprados.map((l) => l.genero.toLowerCase()),
    );

    const catalogo = await this.libros.find({ where: { activo: true } });
    return catalogo
      .filter((libro) => !compradosIds.includes(libro.id) && libro.stock > 0)
      .map((libro) => {
        const genero = libro.genero.toLowerCase();
        const motivos: string[] = [];
        let score = 0;
        if (favoritos.has(genero)) {
          score += 0.6;
          motivos.push(`Coincide con tu género favorito "${libro.genero}"`);
        }
        if (generosComprados.has(genero)) {
          score += 0.4;
          motivos.push(`Ya compraste libros de "${libro.genero}"`);
        }
        return {
          libroId: libro.id,
          titulo: libro.titulo,
          genero: libro.genero,
          score,
          motivo: motivos.join(' · '),
        };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || a.titulo.localeCompare(b.titulo))
      .slice(0, limite);
  }
}

@ApiTags('recomendaciones')
@Public()
@Controller('recomendaciones')
export class RecomendacionesController {
  constructor(private readonly recomendaciones: RecomendacionesService) {}

  @Get('usuario/:usuarioId')
  @ApiOperation({
    summary:
      'Recomendaciones personalizadas según géneros favoritos e historial de compras',
  })
  @ApiOkResponse({ type: [RecomendacionDto] })
  @ApiErrores(400, [404, 'USUARIO_NO_ENCONTRADO'])
  paraUsuario(
    @Param('usuarioId', UuidPipe) usuarioId: string,
    @Query() query: GenerarRecomendacionesQueryDto,
  ): Promise<RecomendacionDto[]> {
    return this.recomendaciones.paraUsuario(usuarioId, query.limite);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Libro]), UsuariosModule, PedidosModule],
  controllers: [RecomendacionesController],
  providers: [RecomendacionesService],
})
export class RecomendacionesModule {}
