import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensajeDeError } from '../../core/errores';
import { FormularioUsuario } from '../../shared/formulario-usuario/formulario-usuario';
import { ModalService } from '../../shared/modal/modal.service';

@Component({
  selector: 'app-registro',
  imports: [RouterLink, FormularioUsuario],
  templateUrl: './registro.html',
  styleUrl: '../auth.scss',
})
export class Registro {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly modal = inject(ModalService);

  protected readonly enviando = signal(false);

  protected registrarse(datos: FormData) {
    this.enviando.set(true);
    this.auth.registro(datos).subscribe({
      next: async ({ usuario }) => {
        await this.router.navigateByUrl('/mi-perfil');
        this.modal.abrir({
          tipo: 'exito',
          titulo: '¡Cuenta creada!',
          mensaje: `Bienvenido/a, ${usuario.nombre}. Ya podés usar Socialito.`,
        });
      },
      error: (error) => {
        this.enviando.set(false);
        this.modal.abrir({
          tipo: 'error',
          titulo: 'No se pudo crear la cuenta',
          mensaje: mensajeDeError(error),
        });
      },
    });
  }
}
