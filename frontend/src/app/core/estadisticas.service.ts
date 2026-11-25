import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';

export interface RangoFechas {
  desde: string;
  hasta: string;
}

export interface PublicacionesPorUsuario {
  datos: {
    usuario: { _id: string; nombre: string; apellido: string; nombreUsuario: string };
    cantidad: number;
  }[];
}

export interface ComentariosPorDia {
  total: number;
  porDia: { fecha: string; cantidad: number }[];
}

export interface ComentariosPorPublicacion {
  datos: { publicacion: { _id: string; titulo: string }; cantidad: number }[];
}

@Injectable({ providedIn: 'root' })
export class EstadisticasService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/estadisticas`;

  publicacionesPorUsuario(rango: RangoFechas) {
    return this.http.get<PublicacionesPorUsuario>(`${this.url}/publicaciones-por-usuario`, {
      params: { ...rango },
    });
  }

  comentariosPorDia(rango: RangoFechas) {
    return this.http.get<ComentariosPorDia>(`${this.url}/comentarios`, {
      params: { ...rango },
    });
  }

  comentariosPorPublicacion(rango: RangoFechas) {
    return this.http.get<ComentariosPorPublicacion>(`${this.url}/comentarios-por-publicacion`, {
      params: { ...rango },
    });
  }
}
