import {
  Controller,
  Get,
  Injectable,
  Module,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { In, MoreThan, Repository } from 'typeorm';
import { ApiErrores } from '../../common/dto/api-errores.decorator';
import { UuidPipe } from '../../common/pipes/uuid.pipe';
import {
  CurrentUser,
  UsuarioAutenticado,
} from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { RecomendacionLibreroResponseDto } from '../libreros/dto/librero-response.dto';
import { LibrerosModule } from '../libreros/libreros.module';
import { LibrerosService } from '../libreros/libreros.service';
import { LibroResumenDto } from '../libros/dto/libro-response.dto';
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
    description:
      '0.6 por género favorito + 0.4 por historial de compras. 0 = popular (sin datos del usuario)',
  })
  score: number;

  @ApiProperty({ example: 'Coincide con tu género favorito "Ciencia ficción"' })
  motivo: string;

  @ApiProperty({
    type: LibroResumenDto,
    description: 'Datos para pintar la tarjeta',
  })
  libro: LibroResumenDto;
}

/**
 * Motor basado en reglas del Hito 1 (misma respuesta), alimentado con datos
 * reales: géneros favoritos del usuario (también contra las categorías del
 * menú) e historial de pedidos PAGADOS. Si el usuario aún no tiene datos, se
 * devuelven los más vendidos para que el Home nunca quede vacío.
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
    const recomendaciones = catalogo
      .filter((libro) => !compradosIds.includes(libro.id) && libro.stock > 0)
      .map((libro) => {
        const genero = libro.genero.toLowerCase();
        const favorito = [
          genero,
          ...(libro.categorias ?? []).map((c) => c.toLowerCase()),
        ].find((g) => favoritos.has(g));
        const motivos: string[] = [];
        let score = 0;
        if (favorito) {
          score += 0.6;
          const nombre =
            [libro.genero, ...(libro.categorias ?? [])].find(
              (g) => g.toLowerCase() === favorito,
            ) ?? libro.genero;
          motivos.push(`Coincide con tu género favorito "${nombre}"`);
        }
        if (generosComprados.has(genero)) {
          score += 0.4;
          motivos.push(`Ya compraste libros de "${libro.genero}"`);
        }
        return { libro, score, motivo: motivos.join(' · ') };
      })
      .filter((r) => r.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score ||
          b.libro.ventas - a.libro.ventas ||
          a.libro.titulo.localeCompare(b.libro.titulo),
      )
      .slice(0, limite);

    if (recomendaciones.length) {
      return recomendaciones.map((r) => this.dto(r.libro, r.score, r.motivo));
    }
    // Sin gustos ni compras: lo más vendido que aún no compró.
    const populares = await this.libros.find({
      where: { activo: true, stock: MoreThan(0) },
      order: { ventas: 'DESC', titulo: 'ASC' },
      take: limite + compradosIds.length,
    });
    return populares
      .filter((l) => !compradosIds.includes(l.id))
      .slice(0, limite)
      .map((l) => this.dto(l, 0, 'Entre los más vendidos de LeeConNos'));
  }

  private dto(libro: Libro, score: number, motivo: string): RecomendacionDto {
    return {
      libroId: libro.id,
      titulo: libro.titulo,
      genero: libro.genero,
      score,
      motivo,
      libro: LibroResumenDto.desde(libro),
    };
  }
}

@ApiTags('recomendaciones')
@Controller('recomendaciones')
export class RecomendacionesController {
  constructor(
    private readonly recomendaciones: RecomendacionesService,
    private readonly libreros: LibrerosService,
  ) {}

  @Public()
  @Get('destacadas')
  @ApiOperation({
    summary: 'Recomendados de nuestros libreros (Home)',
    description:
      'Libros que los libreros marcaron como destacados, con su nota personal y el perfil del librero.',
  })
  @ApiOkResponse({ type: [RecomendacionLibreroResponseDto] })
  destacadas(
    @Query() query: GenerarRecomendacionesQueryDto,
  ): Promise<RecomendacionLibreroResponseDto[]> {
    return this.libreros.destacadas(query.limite);
  }

  @Get('para-mi')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Recomendaciones personalizadas del usuario del token',
    description:
      'Según géneros favoritos e historial de compras; sin datos, los más vendidos.',
  })
  @ApiOkResponse({ type: [RecomendacionDto] })
  @ApiErrores(401)
  paraMi(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Query() query: GenerarRecomendacionesQueryDto,
  ): Promise<RecomendacionDto[]> {
    return this.recomendaciones.paraUsuario(usuario.id, query.limite);
  }

  @Public()
  @Get('usuario/:usuarioId')
  @ApiOperation({
    summary:
      'Recomendaciones personalizadas de un usuario (ruta del Hito 2; preferir GET /recomendaciones/para-mi)',
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
  imports: [
    TypeOrmModule.forFeature([Libro]),
    UsuariosModule,
    PedidosModule,
    LibrerosModule,
  ],
  controllers: [RecomendacionesController],
  providers: [RecomendacionesService],
})
export class RecomendacionesModule {}
