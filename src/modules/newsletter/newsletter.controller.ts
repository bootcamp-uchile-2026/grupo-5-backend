import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrores } from '../../common/dto/api-errores.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../usuarios/entities/usuario.entity';
import {
  BajaNewsletterDto,
  SuscribirNewsletterDto,
  SuscripcionResponseDto,
} from './dto/newsletter.dto';
import { NewsletterService } from './newsletter.service';

@ApiTags('newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletter: NewsletterService) {}

  @Public()
  @Post('suscripciones')
  @ApiOperation({
    summary: 'Suscribirse al newsletter (formulario del Home y del footer)',
    description:
      'Idempotente: suscribir dos veces el mismo email no es un error.',
  })
  @ApiCreatedResponse({ type: SuscripcionResponseDto })
  @ApiErrores(400)
  async suscribir(
    @Body() dto: SuscribirNewsletterDto,
  ): Promise<SuscripcionResponseDto> {
    return SuscripcionResponseDto.desde(
      await this.newsletter.suscribir(dto.email),
    );
  }

  @Public()
  @Post('baja')
  @HttpCode(200)
  @ApiOperation({ summary: 'Darse de baja con el token del enlace del correo' })
  @ApiOkResponse({ type: SuscripcionResponseDto })
  @ApiErrores(400, 404)
  async baja(@Body() dto: BajaNewsletterDto): Promise<SuscripcionResponseDto> {
    return SuscripcionResponseDto.desde(
      await this.newsletter.darDeBajaPorToken(dto.token),
    );
  }

  @Get('suscripciones')
  @Roles(Rol.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suscripciones activas (solo ADMIN)' })
  @ApiOkResponse({ type: [SuscripcionResponseDto] })
  @ApiErrores(401, 403)
  async listar(): Promise<SuscripcionResponseDto[]> {
    return (await this.newsletter.listar()).map((s) =>
      SuscripcionResponseDto.desde(s),
    );
  }
}
