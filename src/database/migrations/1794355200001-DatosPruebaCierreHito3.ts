import { MigrationInterface, QueryRunner } from 'typeorm';

/** Subgénero para cada libro de prueba que no lo tenía (número del libro, subgénero). */
const SUBGENEROS: Array<[number, string]> = [
  [1, 'Space opera'],
  [2, 'Space opera'],
  [3, 'Ciberpunk'],
  [4, 'Distopía'],
  [5, 'Distopía'],
  [6, 'Realismo mágico'],
  [7, 'Realismo mágico'],
  [8, 'Novela experimental'],
  [9, 'Novela contemporánea'],
  [10, 'Alta fantasía'],
  [11, 'Alta fantasía'],
  [12, 'Fantasía juvenil'],
  [13, 'Alta fantasía'],
  [17, 'Poesía amorosa'],
  [18, 'Poesía lírica'],
  [19, 'Fábula'],
  [20, 'Humor'],
  [21, 'Divulgación histórica'],
  [22, 'Divulgación científica'],
  [23, 'Historia latinoamericana'],
  [24, 'Novela histórica'],
  [26, 'Clásico'],
  [30, 'Distopía'],
  [31, 'Novela contemporánea'],
  [32, 'Novela existencial'],
  [33, 'Novela existencial'],
  [34, 'Novela contemporánea'],
  [35, 'Novela contemporánea'],
  [36, 'Novela contemporánea'],
  [37, 'Fantasía contemporánea'],
  [38, 'Realismo mágico'],
  [39, 'Novela experimental'],
  [40, 'Realismo mágico'],
  [42, 'Novela contemporánea'],
  [43, 'Distopía'],
  [44, 'Psicología existencial'],
  [45, 'Novela filosófica'],
  [46, 'Estoicismo'],
  [47, 'Divulgación científica'],
  [48, 'Ecología'],
  [49, 'Crónica'],
  [50, 'Biografía'],
  [51, 'Novela gráfica'],
  [52, 'Desarrollo personal'],
  [53, 'Finanzas personales'],
  [54, 'Emprendimiento'],
  [55, 'Economía'],
  [56, 'Marketing'],
  [57, 'Psicología cognitiva'],
  [58, 'Historia del arte'],
  [59, 'Fotografía'],
  [60, 'Diseño'],
  [61, 'Cine'],
  [62, 'Música'],
  [63, 'Arquitectura'],
  [64, 'Espiritualidad'],
  [65, 'Crianza'],
  [66, 'Nutrición'],
  [67, 'Espiritualidad'],
  [68, 'Ensayo'],
  [69, 'Desarrollo personal'],
  [70, 'Divulgación histórica'],
  [71, 'Ensayo'],
  [72, 'Clásico'],
  [73, 'Romance contemporáneo'],
  [75, 'Ensayo histórico'],
];

/** Otras ediciones del mismo libro, para la galería de la ficha (ids de portada de Open Library). */
const GALERIAS: Array<[number, number[]]> = [
  [1, [14612610, 6502517]],
  [6, [12627383, 4104330, 13215914]],
  [11, [14627509, 8406766]],
  [12, [15155833, 7278006, 8267747]],
];

/** Tráileres oficiales de las adaptaciones al cine (verificados en YouTube). */
const VIDEOS: Array<[number, string]> = [
  [2, 'https://www.youtube.com/watch?v=8g18jFHCLXk'],
  [12, 'https://www.youtube.com/watch?v=VyHV0BRtdxo'],
];

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const portada = (coverId: number) =>
  `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;

/**
 * Datos de prueba pedidos por Frontend para la demo: todos los libros con
 * subgénero, y algunos con galería y video. Solo completa campos vacíos, para
 * no pisar cambios hechos desde la API.
 */
export class DatosPruebaCierreHito31794355200001 implements MigrationInterface {
  name = 'DatosPruebaCierreHito31794355200001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [n, subgenero] of SUBGENEROS)
      await queryRunner.query(
        'UPDATE libros SET subgenero = $1 WHERE id = $2 AND subgenero IS NULL',
        [subgenero, id(n)],
      );
    for (const [n, covers] of GALERIAS)
      await queryRunner.query(
        "UPDATE libros SET galeria = $1 WHERE id = $2 AND galeria = '{}'",
        [covers.map(portada), id(n)],
      );
    for (const [n, url] of VIDEOS)
      await queryRunner.query(
        'UPDATE libros SET video_url = $1 WHERE id = $2 AND video_url IS NULL',
        [url, id(n)],
      );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [n, subgenero] of SUBGENEROS)
      await queryRunner.query(
        'UPDATE libros SET subgenero = NULL WHERE id = $1 AND subgenero = $2',
        [id(n), subgenero],
      );
    for (const [n, covers] of GALERIAS)
      await queryRunner.query(
        "UPDATE libros SET galeria = '{}' WHERE id = $1 AND galeria = $2",
        [id(n), covers.map(portada)],
      );
    for (const [n, url] of VIDEOS)
      await queryRunner.query(
        'UPDATE libros SET video_url = NULL WHERE id = $1 AND video_url = $2',
        [id(n), url],
      );
  }
}
