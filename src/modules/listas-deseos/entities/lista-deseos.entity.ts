export class ListaDeseos {
  id: string;
  usuarioId: string;
  nombre: string;
  esParaRegalo: boolean;
  libros: string[]; // ids de libros
  fechaCreacion: Date;
}
