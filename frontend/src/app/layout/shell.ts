import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { Avatar } from '../shared/avatar';
import { SoloAdminDirective } from '../shared/directivas/solo-admin.directive';
import { NombreCompletoPipe } from '../shared/pipes/nombre-completo.pipe';
import { Icono } from '../shared/icono';
import { ModalService } from '../shared/modal/modal.service';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    Icono,
    Avatar,
    SoloAdminDirective,
    NombreCompletoPipe,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly modal = inject(ModalService);

  protected async cerrarSesion() {
    this.auth.cerrarSesion();
    await this.router.navigateByUrl('/login');
    this.modal.abrir({ titulo: 'Sesión cerrada', mensaje: 'Cerraste sesión. ¡Hasta pronto!' });
  }
}
