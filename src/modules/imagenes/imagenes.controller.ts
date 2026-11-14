import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { memoryStorage } from 'multer';
import { ApiErrores } from '../../common/dto/api-errores.decorator';
import { UuidPipe } from '../../common/pipes/uuid.pipe';
import {
  CurrentUser,
  UsuarioAutenticado,
} from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Libro } from '../libros/entities/libro.entity';
import { LibroExistePipe } from '../libros/pipes/libro-existe.pipe';
import { Rol } from '../usuarios/entities/usuario.entity';
import { tamanoMaximo } from './almacenamiento';
import { ImagenResponseDto, SubirImagenDto } from './dto/imagen.dto';
import { UsoImagen } from './entities/imagen.entity';
import { ImagenesService } from './imagenes.service';

/** Recibe un archivo en memoria (campo "imagen") para validarlo antes de guardarlo. */
const ConImagen = () =>
  UseInterceptors(
    FileInterceptor('imagen', {
      storage: memoryStorage(),
      limits: { fileSize: tamanoMaximo(), files: 1 },
    }),
  );

const ERRORES_SUBIDA = [
  [400, 'IMAGEN_REQUERIDA: no se envió el campo "imagen"'],
  401,
  403,
  [413, 'ARCHIVO_DEMASIADO_GRANDE: supera IMAGEN_MAX_MB'],
  [415, 'TIPO_ARCHIVO_NO_PERMITIDO: no es JPG, PNG ni WEBP'],
] as Array<number | [number, string]>;

@ApiTags('imagenes')
@Controller('imagenes')
export class ImagenesController {
  constructor(private readonly imagenes: ImagenesService) {}

  @Post()
  @Roles(Rol.LIBRERO, Rol.ADMIN)
  @ApiBearerAuth()
  @ConImagen()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: SubirImagenDto })
  @ApiOperation({
    summary: 'Subir una imagen (LIBRERO o ADMIN)',
    description:
      'Guarda la imagen y devuelve su URL pública. Para asociarla a un libro, usar ' +
      'POST /libros/{id}/portada o POST /libros/{id}/galeria.',
  })
  @ApiCreatedResponse({ type: ImagenResponseDto })
  @ApiErrores(...ERRORES_SUBIDA)
  async subir(
    @UploadedFile() archivo: Express.Multer.File | undefined,
    @CurrentUser() usuario: UsuarioAutenticado,
    @Req() req: Request,
  ): Promise<ImagenResponseDto> {
    return ImagenResponseDto.desde(
      await this.imagenes.guardar(archivo, {
        uso: UsoImagen.GENERAL,
        usuarioId: usuario.id,
        req,
      }),
    );
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Datos de una imagen subida' })
  @ApiOkResponse({ type: ImagenResponseDto })
  @ApiErrores(400, [404, 'IMAGEN_NO_ENCONTRADA'])
  async obtener(@Param('id', UuidPipe) id: string): Promise<ImagenResponseDto> {
    return ImagenResponseDto.desde(await this.imagenes.obtener(id));
  }

  @Delete(':id')
  @Roles(Rol.LIBRERO, Rol.ADMIN)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({
    summary: 'Eliminar una imagen (LIBRERO o ADMIN)',
    description:
      'Borra el archivo y lo quita de la portada o galería del libro que la usaba.',
  })
  @ApiNoContentResponse({ description: 'Imagen eliminada' })
  @ApiErrores(400, 401, 403, [404, 'IMAGEN_NO_ENCONTRADA'])
  eliminar(@Param('id', UuidPipe) id: string): Promise<void> {
    return this.imagenes.eliminar(id);
  }
}

/** Imágenes integradas a la administración de productos. */
@ApiTags('libros')
@Controller('libros')
export class LibrosImagenesController {
  constructor(private readonly imagenes: ImagenesService) {}

  @Public()
  @Get(':id/imagenes')
  @ApiOperation({
    summary: 'Imágenes subidas para un libro (portadas y galería)',
  })
  @ApiOkResponse({ type: [ImagenResponseDto] })
  @ApiErrores(400, [404, 'LIBRO_NO_ENCONTRADO'])
  async listar(
    @Param('id', LibroExistePipe) libro: Libro,
  ): Promise<ImagenResponseDto[]> {
    return (await this.imagenes.listarPorLibro(libro.id)).map((i) =>
      ImagenResponseDto.desde(i),
    );
  }

  @Post(':id/portada')
  @Roles(Rol.LIBRERO, Rol.ADMIN)
  @ApiBearerAuth()
  @ConImagen()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: SubirImagenDto })
  @ApiOperation({
    summary: 'Subir la portada de un libro (LIBRERO o ADMIN)',
    description: 'La imagen queda como portadaUrl del libro.',
  })
  @ApiCreatedResponse({ type: ImagenResponseDto })
  @ApiErrores(...ERRORES_SUBIDA, [404, 'LIBRO_NO_ENCONTRADO'])
  async subirPortada(
    @Param('id', LibroExistePipe) libro: Libro,
    @UploadedFile() archivo: Express.Multer.File | undefined,
    @CurrentUser() usuario: UsuarioAutenticado,
    @Req() req: Request,
  ): Promise<ImagenResponseDto> {
    return ImagenResponseDto.desde(
      await this.imagenes.subirPortada(libro, archivo, usuario.id, req),
    );
  }

  @Post(':id/galeria')
  @Roles(Rol.LIBRERO, Rol.ADMIN)
  @ApiBearerAuth()
  @ConImagen()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: SubirImagenDto })
  @ApiOperation({
    summary: 'Agregar una imagen a la galería del libro (LIBRERO o ADMIN)',
    description: 'La URL se agrega al final de galeria en la ficha del libro.',
  })
  @ApiCreatedResponse({ type: ImagenResponseDto })
  @ApiErrores(...ERRORES_SUBIDA, [404, 'LIBRO_NO_ENCONTRADO'])
  async agregarAGaleria(
    @Param('id', LibroExistePipe) libro: Libro,
    @UploadedFile() archivo: Express.Multer.File | undefined,
    @CurrentUser() usuario: UsuarioAutenticado,
    @Req() req: Request,
  ): Promise<ImagenResponseDto> {
    return ImagenResponseDto.desde(
      await this.imagenes.agregarAGaleria(libro, archivo, usuario.id, req),
    );
  }
}
