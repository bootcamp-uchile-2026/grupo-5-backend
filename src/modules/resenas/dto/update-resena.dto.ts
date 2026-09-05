import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateResenaDto } from './create-resena.dto';

export class UpdateResenaDto extends PartialType(
  OmitType(CreateResenaDto, ['usuarioId', 'libroId'] as const),
) {}
