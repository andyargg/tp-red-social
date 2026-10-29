import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Sesion, Usuario } from './usuario';

const CLAVE_TOKEN = 'token';
const CLAVE_USUARIO = 'usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/auth`;

  private readonly usuarioActual = signal<Usuario | null>(leerUsuarioGuardado());
  readonly usuario = this.usuarioActual.asReadonly();
  readonly logueado = computed(() => this.usuarioActual() !== null);

  get token(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  // los datos van como FormData porque incluyen la imagen de perfil
  registro(datos: FormData): Observable<Sesion> {
    return this.http.post<Sesion>(`${this.url}/registro`, datos).pipe(tap((s) => this.guardar(s)));
  }

  login(usuario: string, password: string): Observable<Sesion> {
    return this.http
      .post<Sesion>(`${this.url}/login`, { usuario, password })
      .pipe(tap((s) => this.guardar(s)));
  }

  cerrarSesion() {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    this.usuarioActual.set(null);
  }

  private guardar({ usuario, token }: Sesion) {
    localStorage.setItem(CLAVE_TOKEN, token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
    this.usuarioActual.set(usuario);
  }
}

function leerUsuarioGuardado(): Usuario | null {
  try {
    const guardado = localStorage.getItem(CLAVE_USUARIO);
    return guardado ? (JSON.parse(guardado) as Usuario) : null;
  } catch {
    return null;
  }
}
