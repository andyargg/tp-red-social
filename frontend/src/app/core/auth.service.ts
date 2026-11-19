import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { usuarioDelToken } from './jwt';
import { Sesion, Usuario } from './usuario';

const CLAVE_TOKEN = 'token';
const CLAVE_USUARIO_ANTERIOR = 'usuario';
const VALIDEZ_DE_LOS_DATOS = 10_000;

export type CambioDeSesion = 'ninguno' | 'cerrada' | 'otroUsuario' | 'actualizada';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/auth`;

  private readonly tokenActual = signal<string | null>(leer(CLAVE_TOKEN));
  private readonly usuarioActual = signal<Usuario | null>(null);
  private readonly verificadaActual = signal(false);
  private ultimaValidacion = 0;

  readonly token = this.tokenActual.asReadonly();
  readonly usuario = this.usuarioActual.asReadonly();
  readonly verificada = this.verificadaActual.asReadonly();
  readonly logueado = computed(() => this.usuarioActual() !== null);

  constructor() {
    borrar(CLAVE_USUARIO_ANTERIOR);
  }

  registro(datos: FormData): Observable<Sesion> {
    return this.http.post<Sesion>(`${this.url}/registro`, datos).pipe(tap((s) => this.guardar(s)));
  }

  login(usuario: string, password: string): Observable<Sesion> {
    return this.http
      .post<Sesion>(`${this.url}/login`, { usuario, password })
      .pipe(tap((s) => this.guardar(s)));
  }

  autorizar(): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.url}/autorizar`, null).pipe(
      tap((usuario) => {
        this.actualizarUsuario(usuario);
        this.verificadaActual.set(true);
        this.ultimaValidacion = Date.now();
      }),
    );
  }

  refrescarUsuario() {
    if (!this.tokenActual() || Date.now() - this.ultimaValidacion < VALIDEZ_DE_LOS_DATOS) return;
    this.autorizar().subscribe({ error: () => undefined });
  }

  refrescar(): Observable<{ token: string }> {
    return this.http
      .post<{ token: string }>(`${this.url}/refrescar`, null)
      .pipe(tap(({ token }) => this.guardarToken(token)));
  }

  editarPerfil(datos: FormData): Observable<Usuario> {
    return this.http
      .patch<Usuario>(`${environment.apiUrl}/usuarios/yo`, datos)
      .pipe(tap((usuario) => this.actualizarUsuario(usuario)));
  }

  sincronizar(clave: string | null): CambioDeSesion {
    if (clave !== null && clave !== CLAVE_TOKEN) return 'ninguno';
    const anterior = this.tokenActual();
    const token = leer(CLAVE_TOKEN);
    this.tokenActual.set(token);

    if (!token) {
      this.usuarioActual.set(null);
      this.verificadaActual.set(false);
      return anterior ? 'cerrada' : 'ninguno';
    }
    const mismoUsuario = anterior !== null && usuarioDelToken(anterior) === usuarioDelToken(token);
    if (!mismoUsuario) {
      this.usuarioActual.set(null);
      this.verificadaActual.set(false);
      return 'otroUsuario';
    }
    return 'actualizada';
  }

  cerrarSesion() {
    borrar(CLAVE_TOKEN);
    this.tokenActual.set(null);
    this.usuarioActual.set(null);
    this.verificadaActual.set(false);
    this.ultimaValidacion = 0;
  }

  private guardar({ usuario, token }: Sesion) {
    this.guardarToken(token);
    this.actualizarUsuario(usuario);
    this.verificadaActual.set(true);
    this.ultimaValidacion = Date.now();
  }

  private guardarToken(token: string) {
    localStorage.setItem(CLAVE_TOKEN, token);
    this.tokenActual.set(token);
  }

  private actualizarUsuario(usuario: Usuario) {
    this.usuarioActual.set(usuario);
  }
}

function leer(clave: string): string | null {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function borrar(clave: string) {
  try {
    localStorage.removeItem(clave);
  } catch {
    return;
  }
}
