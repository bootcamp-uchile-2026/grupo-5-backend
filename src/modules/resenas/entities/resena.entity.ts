export class Resena {
  id: string;
  usuarioId: string;
  libroId: string;
  calificacion: number; // 1 a 5
  comentario: string;
  verificada: boolean; // true si el usuario compró el libro
  fecha: Date;
}
