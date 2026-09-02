import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateListaDeseosDto } from './create-lista-deseos.dto';

export class UpdateListaDeseosDto extends PartialType(
  OmitType(CreateListaDeseosDto, ['usuarioId'] as const),
) {}
