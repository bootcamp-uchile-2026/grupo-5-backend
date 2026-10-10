import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUsuarioDto } from './create-usuario.dto';

/** El email y el rol no se modifican por este endpoint. */
export class UpdateUsuarioDto extends PartialType(
  OmitType(CreateUsuarioDto, ['email', 'rol'] as const),
) {}
