import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrores } from '../../common/dto/api-errores.decorator';
import { UuidPipe } from '../../common/pipes/uuid.pipe';
import {
  CurrentUser,
  UsuarioAutenticado,
} from '../auth/decorators/current-user.decorator';
import { CarritoService } from './carrito.service';
import {
  ActualizarItemDto,
  AgregarItemDto,
  CarritoResponseDto,
} from './dto/carrito.dto';

// El carrito siempre es el del usuario dueño del token: no recibe usuarioId.
@ApiTags('carrito')
@ApiBearerAuth()
@Controller('carrito')
export class CarritoController {
  constructor(private readonly carrito: CarritoService) {}

  @Get()
  @ApiOperation({ summary: 'Ver mi carrito con precios y stock vigentes' })
  @ApiOkResponse({ type: CarritoResponseDto })
  @ApiErrores(401)
  obtener(
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<CarritoResponseDto> {
    return this.carrito.obtener(usuario.id);
  }

  @Post('items')
  @HttpCode(200)
  @ApiOperation({ summary: 'Agregar un libro al carrito (suma si ya estaba)' })
  @ApiOkResponse({
    type: CarritoResponseDto,
    description: 'Carrito actualizado',
  })
  @ApiErrores(
    400,
    401,
    [404, 'LIBRO_NO_ENCONTRADO'],
    [409, 'STOCK_INSUFICIENTE'],
  )
  agregar(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Body() dto: AgregarItemDto,
  ): Promise<CarritoResponseDto> {
    return this.carrito.agregar(usuario.id, dto);
  }

  @Patch('items/:libroId')
  @ApiOperation({ summary: 'Cambiar la cantidad de un libro del carrito' })
  @ApiOkResponse({
    type: CarritoResponseDto,
    description: 'Carrito actualizado',
  })
  @ApiErrores(
    400,
    401,
    [404, 'ITEM_NO_ESTA_EN_CARRITO'],
    [409, 'STOCK_INSUFICIENTE'],
  )
  actualizar(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('libroId', UuidPipe) libroId: string,
    @Body() dto: ActualizarItemDto,
  ): Promise<CarritoResponseDto> {
    return this.carrito.actualizar(usuario.id, libroId, dto);
  }

  @Delete('items/:libroId')
  @ApiOperation({ summary: 'Quitar un libro del carrito' })
  @ApiOkResponse({
    type: CarritoResponseDto,
    description: 'Carrito actualizado',
  })
  @ApiErrores(400, 401, [404, 'ITEM_NO_ESTA_EN_CARRITO'])
  quitar(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('libroId', UuidPipe) libroId: string,
  ): Promise<CarritoResponseDto> {
    return this.carrito.quitar(usuario.id, libroId);
  }

  @Delete()
  @HttpCode(204)
  @ApiOperation({ summary: 'Vaciar mi carrito' })
  @ApiNoContentResponse({ description: 'Carrito vacío' })
  @ApiErrores(401)
  vaciar(@CurrentUser() usuario: UsuarioAutenticado): Promise<void> {
    return this.carrito.vaciar(usuario.id);
  }
}
