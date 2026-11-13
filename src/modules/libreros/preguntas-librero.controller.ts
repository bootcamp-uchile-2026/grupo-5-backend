import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrores } from '../../common/dto/api-errores.decorator';
import { UuidPipe } from '../../common/pipes/uuid.pipe';
import {
  CurrentUser,
  UsuarioAutenticado,
} from '../auth/decorators/current-user.decorator';
import { AuthOpcional } from '../auth/decorators/public.decorator';
import {
  CrearPreguntaLibreroDto,
  PreguntaEnviadaDto,
  PreguntaLibreroDto,
  ResponderPreguntaDto,
} from './dto/pregunta-librero.dto';
import { Librero } from './entities/perfil-librero.entity';
import { LibreroExistePipe } from './pipes/librero-existe.pipe';
import { PreguntasLibreroService } from './preguntas-librero.service';

const PARAM_ID = ApiParam({
  name: 'id',
  description: 'uuid o slug del librero (p. ej. "gregorio-samsa")',
});

@ApiTags('libreros')
@Controller('libreros/:id/preguntas')
export class PreguntasLibreroController {
  constructor(private readonly preguntas: PreguntasLibreroService) {}

  @AuthOpcional()
  @Post()
  @PARAM_ID
  @ApiOperation({
    summary: 'Enviar una pregunta al librero ("¿No sabes qué leer?")',
    description:
      'No requiere sesión. Si viene token, la pregunta queda asociada a la cuenta. ' +
      'El librero recibe un aviso por correo (dummy: queda en el log).',
  })
  @ApiCreatedResponse({ type: PreguntaEnviadaDto })
  @ApiErrores(400, [404, 'LIBRERO_NO_ENCONTRADO'])
  async preguntar(
    @Param('id', LibreroExistePipe) librero: Librero,
    @Body() dto: CrearPreguntaLibreroDto,
    @CurrentUser() usuario?: UsuarioAutenticado,
  ): Promise<PreguntaEnviadaDto> {
    const pregunta = await this.preguntas.crear(librero, dto, usuario);
    return {
      id: pregunta.id,
      mensaje: `${librero.nombreCorto} recibió tu pregunta y te responderá a ${pregunta.email}`,
    };
  }

  @Get()
  @ApiBearerAuth()
  @PARAM_ID
  @ApiOperation({
    summary: 'Preguntas recibidas (el librero dueño del perfil o ADMIN)',
  })
  @ApiOkResponse({ type: [PreguntaLibreroDto] })
  @ApiErrores(401, 403, [404, 'LIBRERO_NO_ENCONTRADO'])
  async listar(
    @Param('id', LibreroExistePipe) librero: Librero,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<PreguntaLibreroDto[]> {
    return (await this.preguntas.listar(librero, usuario)).map((p) =>
      PreguntaLibreroDto.desde(p),
    );
  }

  @Post(':preguntaId/respuesta')
  @HttpCode(200)
  @ApiBearerAuth()
  @PARAM_ID
  @ApiOperation({
    summary: 'Responder una pregunta (el librero dueño del perfil o ADMIN)',
    description: 'Quien preguntó recibe la respuesta por correo (dummy).',
  })
  @ApiOkResponse({ type: PreguntaLibreroDto })
  @ApiErrores(400, 401, 403, [
    404,
    'LIBRERO_NO_ENCONTRADO o PREGUNTA_NO_ENCONTRADA',
  ])
  async responder(
    @Param('id', LibreroExistePipe) librero: Librero,
    @Param('preguntaId', UuidPipe) preguntaId: string,
    @Body() dto: ResponderPreguntaDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<PreguntaLibreroDto> {
    return PreguntaLibreroDto.desde(
      await this.preguntas.responder(
        librero,
        preguntaId,
        dto.respuesta,
        usuario,
      ),
    );
  }
}
