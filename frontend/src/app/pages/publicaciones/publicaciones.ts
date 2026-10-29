import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Icono } from '../../shared/icono';

// el listado, el orden y los me gusta llegan en el sprint 2
@Component({
  selector: 'app-publicaciones',
  imports: [RouterLink, Icono],
  template: `
    <section class="feed">
      <header class="page-header">
        <div>
          <h1>Publicaciones</h1>
          <p>Lo último que compartió la comunidad.</p>
        </div>
      </header>

      <div class="card vacio">
        <span class="icono-vacio"><app-icono nombre="bandeja" [tamanio]="20" /></span>
        <strong>Todavía no hay publicaciones</strong>
        @if (auth.usuario(); as usuario) {
          <p>{{ usuario.nombre }}, pronto vas a poder publicar y ver lo que comparten los demás.</p>
        } @else {
          <p>Ingresá o creá una cuenta para empezar a publicar.</p>
          <div class="acciones">
            <a class="button" routerLink="/login">Ingresar</a>
            <a class="button secondary" routerLink="/registro">Crear cuenta</a>
          </div>
        }
      </div>
    </section>
  `,
  styleUrl: '../vacio.scss',
  styles: `
    .feed {
      max-width: 40rem;
      margin: 0 auto;
    }
  `,
})
export class Publicaciones {
  protected readonly auth = inject(AuthService);
}
