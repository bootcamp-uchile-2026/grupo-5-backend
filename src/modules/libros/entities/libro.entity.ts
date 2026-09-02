export class Libro {
  id: string;
  isbn: string;
  titulo: string;
  autor: string;
  genero: string;
  editorial?: string;
  anioPublicacion?: number;
  sinopsis?: string;
  portadaUrl?: string;
  stock: number;
  precio: number;
}
