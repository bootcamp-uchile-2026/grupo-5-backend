import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { LibroResumenDto } from '../../libros/dto/libro-response.dto';
import { ListaDeseos } from '../entities/lista-deseos.entity';

export class AgregarLibroListaDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  libroId: string;
}

export class ListaDeseosResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  usuarioId: string;

  @ApiProperty({ example: 'Regalos' })
  nombre: string;

  @ApiProperty()
  esParaRegalo: boolean;

  @ApiProperty({
    description: 'true en la lista "Favoritos" del botón corazón',
  })
  esFavoritos: boolean;

  @ApiProperty({
    type: [String],
    description: 'Ids de los libros (formato del Hito 1)',
  })
  libros: string[];

  @ApiProperty({
    type: [LibroResumenDto],
    description: 'Libros de la lista, del más reciente al más antiguo',
  })
  items: LibroResumenDto[];

  @ApiProperty()
  fechaCreacion: Date;

  static desde(
    lista: ListaDeseos,
    resumenes: Map<string, LibroResumenDto>,
  ): ListaDeseosResponseDto {
    const ids = [...(lista.libros ?? [])]
      .sort((a, b) => b.agregadoEn.getTime() - a.agregadoEn.getTime())
      .map((l) => l.libroId);
    return {
      id: lista.id,
      usuarioId: lista.usuarioId,
      nombre: lista.nombre,
      esParaRegalo: lista.esParaRegalo,
      esFavoritos: lista.esFavoritos,
      libros: ids,
      items: ids.flatMap((id) => {
        const libro = resumenes.get(id);
        return libro ? [libro] : [];
      }),
      fechaCreacion: lista.creadoEn,
    };
  }
}
