import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePerfilLibreroDto } from './dto/create-perfil-librero.dto';
import { UpdatePerfilLibreroDto } from './dto/update-perfil-librero.dto';
import { CreateSeccionCuradaDto } from './dto/create-seccion-curada.dto';
import { PerfilLibrero, SeccionCurada } from './entities/perfil-librero.entity';
import { randomUUID } from 'crypto';

/**
 * Servicio de Libreros.
 * Gestiona los perfiles editoriales (espacios con voz propia) y sus
 * secciones curadas de recomendaciones personales.
 */
@Injectable()
export class LibrerosService {
  private readonly perfiles: PerfilLibrero[] = [];
  private readonly secciones: SeccionCurada[] = [];

  create(dto: CreatePerfilLibreroDto): PerfilLibrero {
    const perfil: PerfilLibrero = { id: randomUUID(), seguidores: [], ...dto };
    this.perfiles.push(perfil);
    return perfil;
  }

  findAll(): PerfilLibrero[] {
    return this.perfiles;
  }

  findOne(id: string): PerfilLibrero {
    const perfil = this.perfiles.find((p) => p.id === id);
    if (!perfil) throw new NotFoundException(`Perfil de librero ${id} no encontrado`);
    return perfil;
  }

  update(id: string, dto: UpdatePerfilLibreroDto): PerfilLibrero {
    const perfil = this.findOne(id);
    Object.assign(perfil, dto);
    return perfil;
  }

  seguir(libreroId: string, usuarioId: string): PerfilLibrero {
    const perfil = this.findOne(libreroId);
    if (!perfil.seguidores.includes(usuarioId)) {
      perfil.seguidores.push(usuarioId);
    }
    return perfil;
  }

  agregarSeccionCurada(libreroId: string, dto: CreateSeccionCuradaDto): SeccionCurada {
    this.findOne(libreroId); // valida existencia
    const seccion: SeccionCurada = { id: randomUUID(), libreroId, ...dto };
    this.secciones.push(seccion);
    return seccion;
  }

  obtenerSeccionCurada(libreroId: string): SeccionCurada[] {
    return this.secciones
      .filter((s) => s.libreroId === libreroId)
      .sort((a, b) => a.orden - b.orden);
  }
}
