import { Usuario } from './usuario';

export type Autor = Pick<Usuario, '_id' | 'nombre' | 'apellido' | 'nombreUsuario' | 'imagenPerfil'>;

export type Orden = 'fecha' | 'meGusta';

export interface Publicacion {
  _id: string;
  autor: Autor;
  titulo: string;
  mensaje: string;
  imagen: string | null;
  cantidadMeGusta: number;
  meGustaYo: boolean;
  cantidadComentarios: number;
  createdAt: string;
}

export interface Comentario {
  _id: string;
  autor: Autor;
  mensaje: string;
  modificado: boolean;
  createdAt: string;
}

export interface Pagina {
  total: number;
  offset: number;
  limit: number;
}

export interface PaginaPublicaciones extends Pagina {
  publicaciones: Publicacion[];
}

export interface PaginaComentarios extends Pagina {
  comentarios: Comentario[];
}
