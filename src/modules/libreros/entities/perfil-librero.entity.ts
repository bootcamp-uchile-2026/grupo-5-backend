export class PerfilLibrero {
  id: string;
  usuarioId: string; // referencia al Usuario con rol LIBRERO
  alias: string; // nombre público, ej. "El rincón de Marta"
  bio: string;
  estiloEditorial?: string; // voz/tono del librero
  especialidades: string[]; // géneros que más recomienda
  fotoUrl?: string;
  seguidores: string[]; // ids de usuarios (clientes) que lo siguen
}

export class SeccionCurada {
  id: string;
  libreroId: string;
  libroId: string;
  notaPersonal: string; // recomendación en la voz del librero
  orden: number;
}
