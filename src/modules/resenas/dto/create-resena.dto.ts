import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, Min } from 'class-validator';

export class CreateResenaDto {
  @ApiProperty({ example: 'usr-123' })
  @IsString()
  usuarioId: string;

  @ApiProperty({ example: 'libro-456' })
  @IsString()
  libroId: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  calificacion: number;

  @ApiProperty({ example: 'Una recomendación perfecta, tal como me la describió el librero.' })
  @IsString()
  comentario: string;
}
