import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Orden, PaginaComentarios, PaginaPublicaciones, Publicacion } from './publicacion';

export interface FiltrosPublicaciones {
  orden?: Orden;
  usuario?: string;
  offset?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class PublicacionesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/publicaciones`;

  listar(filtros: FiltrosPublicaciones): Observable<PaginaPublicaciones> {
    const params = Object.fromEntries(
      Object.entries(filtros).filter(([, valor]) => valor !== undefined),
    );
    return this.http.get<PaginaPublicaciones>(this.url, { params });
  }

  // FormData con titulo, mensaje e imagen opcional
  crear(datos: FormData): Observable<Publicacion> {
    return this.http.post<Publicacion>(this.url, datos);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  darMeGusta(id: string): Observable<Publicacion> {
    return this.http.post<Publicacion>(`${this.url}/${id}/me-gusta`, null);
  }

  quitarMeGusta(id: string): Observable<Publicacion> {
    return this.http.delete<Publicacion>(`${this.url}/${id}/me-gusta`);
  }

  comentarios(id: string, offset = 0, limit = 10): Observable<PaginaComentarios> {
    return this.http.get<PaginaComentarios>(`${this.url}/${id}/comentarios`, {
      params: { offset, limit },
    });
  }
}
