import { PartialType, OmitType } from '@nestjs/swagger';
import { CreatePerfilLibreroDto } from './create-perfil-librero.dto';

export class UpdatePerfilLibreroDto extends PartialType(
  OmitType(CreatePerfilLibreroDto, ['usuarioId'] as const),
) {}
