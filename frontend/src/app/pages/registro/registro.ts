import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensajeDeError } from '../../core/errores';
import { Avatar } from '../../shared/avatar';
import { Icono } from '../../shared/icono';
import { ModalService } from '../../shared/modal/modal.service';
import {
  CORREO_REGEX,
  FECHA_MINIMA,
  NOMBRE_USUARIO_REGEX,
  PASSWORD_REGEX,
  coinciden,
  fechaPasada,
  hoyLocal,
  imagenValida,
  obligatorio,
} from '../../shared/validadores';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink, Icono, Avatar],
  templateUrl: './registro.html',
  styleUrls: ['../auth.scss', './registro.scss'],
})
export class Registro {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly modal = inject(ModalService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly enviando = signal(false);
  protected readonly vistaPrevia = signal<string | null>(null);
  protected readonly hoy = hoyLocal();
  protected readonly fechaMinima = FECHA_MINIMA;

  protected readonly form = this.fb.group(
    {
      nombre: ['', [obligatorio, Validators.maxLength(50)]],
      apellido: ['', [obligatorio, Validators.maxLength(50)]],
      correo: ['', [obligatorio, Validators.pattern(CORREO_REGEX)]],
      nombreUsuario: ['', [obligatorio, Validators.pattern(NOMBRE_USUARIO_REGEX)]],
      password: ['', [Validators.required, Validators.pattern(PASSWORD_REGEX)]],
      repetirPassword: ['', [Validators.required]],
      fechaNacimiento: ['', [Validators.required, fechaPasada]],
      descripcion: ['', [Validators.maxLength(200)]],
      imagenPerfil: this.fb.control<File | null>(null, [imagenValida]),
    },
    { validators: coinciden('password', 'repetirPassword') },
  );

  protected invalido(campo: keyof typeof this.form.controls) {
    const control = this.form.controls[campo];
    return control.touched && control.invalid;
  }

  protected elegirImagen(evento: Event) {
    const archivo = (evento.target as HTMLInputElement).files?.[0] ?? null;
    const control = this.form.controls.imagenPerfil;
    control.setValue(archivo);
    control.markAsTouched();

    const anterior = this.vistaPrevia();
    if (anterior) URL.revokeObjectURL(anterior);
    this.vistaPrevia.set(archivo && control.valid ? URL.createObjectURL(archivo) : null);
  }

  protected registrarse() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { repetirPassword, imagenPerfil, ...datos } = this.form.getRawValue();
    const formData = new FormData();
    // la contraseña va tal cual: los espacios son parte de ella
    for (const [campo, valor] of Object.entries(datos)) {
      formData.append(campo, campo === 'password' ? valor : valor.trim());
    }
    if (imagenPerfil) formData.append('imagenPerfil', imagenPerfil);

    this.enviando.set(true);
    this.auth.registro(formData).subscribe({
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
