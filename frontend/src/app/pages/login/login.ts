import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensajeDeError } from '../../core/errores';
import { AutofocoDirective } from '../../shared/directivas/autofoco.directive';
import { Icono } from '../../shared/icono';
import { ModalService } from '../../shared/modal/modal.service';
import { PASSWORD_REGEX, obligatorio } from '../../shared/validadores';

export const ACCESOS_RAPIDOS = [
  { rol: 'Administrador', usuario: 'admin.demo', password: 'Admin1234' },
  { rol: 'Usuario', usuario: 'lucia.prueba', password: 'Prueba1234' },
] as const;

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, Icono, AutofocoDirective],
  templateUrl: './login.html',
  styleUrl: '../auth.scss',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly modal = inject(ModalService);

  protected readonly enviando = signal(false);
  protected readonly verPassword = signal(false);
  protected readonly accesos = ACCESOS_RAPIDOS;

  protected readonly form = inject(NonNullableFormBuilder).group({
    usuario: ['', [obligatorio]],
    password: ['', [Validators.required, Validators.pattern(PASSWORD_REGEX)]],
  });

  protected accesoRapido(acceso: (typeof ACCESOS_RAPIDOS)[number]) {
    this.form.setValue({ usuario: acceso.usuario, password: acceso.password });
    this.ingresar();
  }

  protected ingresar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { usuario, password } = this.form.getRawValue();
    this.enviando.set(true);
    this.auth.login(usuario.trim(), password).subscribe({
      next: async ({ usuario }) => {
        await this.router.navigateByUrl('/publicaciones');
        this.modal.abrir({
          tipo: 'exito',
          titulo: `¡Hola, ${usuario.nombre}!`,
          mensaje: 'Ingresaste correctamente.',
        });
      },
      error: (error) => {
        this.enviando.set(false);
        this.modal.abrir({
          tipo: 'error',
          titulo: 'No pudiste ingresar',
          mensaje: mensajeDeError(error),
        });
      },
    });
  }
}
