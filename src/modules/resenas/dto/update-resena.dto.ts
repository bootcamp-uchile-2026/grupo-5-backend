import { PartialType } from '@nestjs/swagger';
import { CrearResenaDto } from './create-resena.dto';

export class UpdateResenaDto extends PartialType(CrearResenaDto) {}
