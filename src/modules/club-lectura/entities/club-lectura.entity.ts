export class ClubLectura {
  id: string;
  libroId: string;
  titulo: string;
  descripcion?: string;
  fechaInicio: Date;
  fechaFin?: Date;
  participantes: string[]; // ids de usuarios
}

export class HiloDiscusion {
  id: string;
  clubLecturaId: string;
  usuarioId: string;
  titulo: string;
  contenido: string;
  fechaCreacion: Date;
}

export class ComentarioHilo {
  id: string;
  hiloId: string;
  usuarioId: string;
  contenido: string;
  fechaCreacion: Date;
}

export class ProgresoLectura {
  id: string;
  clubLecturaId: string;
  usuarioId: string;
  paginaActual: number;
  porcentaje: number; // 0 a 100
}
