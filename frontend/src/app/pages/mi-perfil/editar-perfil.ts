import { Component, DestroyRef, inject, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { mensajeDeError } from '../../core/errores';
import { Usuario } from '../../core/usuario';
import { Avatar } from '../../shared/avatar';
import { Icono } from '../../shared/icono';
import { ModalService } from '../../shared/modal/modal.service';
import {
  FECHA_MINIMA,
  fechaPasada,
  hoyLocal,
  obligatorio,
  problemaDeImagen,
} from '../../shared/validadores';

@Component({
  selector: 'app-editar-perfil',
  imports: [ReactiveFormsModule, Avatar, Icono],
  templateUrl: './editar-perfil.html',
  styleUrls: ['../auth.scss', './editar-perfil.scss'],
})
export class EditarPerfil {
  private readonly auth = inject(AuthService);
  private readonly modal = inject(ModalService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly guardado = output<Usuario>();
  readonly cancelado = output<void>();

  private readonly usuario = this.auth.usuario()!;
  protected readonly enviando = signal(false);
  protected readonly hoy = hoyLocal();
  protected readonly fechaMinima = FECHA_MINIMA;
  protected readonly foto = signal<string | null>(this.usuario.imagenPerfil);
  protected readonly errorImagen = signal<string | null>(null);
  private vistaPrevia: string | null = null;
  private quitarImagen = false;

  protected readonly form = this.fb.group({
    nombre: [this.usuario.nombre, [obligatorio, Validators.maxLength(50)]],
    apellido: [this.usuario.apellido, [obligatorio, Validators.maxLength(50)]],
    fechaNacimiento: [
      this.usuario.fechaNacimiento.slice(0, 10),
      [Validators.required, fechaPasada],
    ],
    descripcion: [this.usuario.descripcion, [Validators.maxLength(200)]],
    imagenPerfil: this.fb.control<File | null>(null),
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.liberarVistaPrevia());
  }

  protected invalido(campo: keyof typeof this.form.controls) {
    const control = this.form.controls[campo];
    return control.touched && control.invalid;
  }

  protected elegirImagen(evento: Event) {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    input.value = '';
    if (!archivo) return;
    const problema = problemaDeImagen(archivo);
    this.errorImagen.set(problema);
    this.liberarVistaPrevia();
    if (problema) {
      this.form.controls.imagenPerfil.setValue(null);
      this.foto.set(this.quitarImagen ? null : this.usuario.imagenPerfil);
      return;
    }

    this.form.controls.imagenPerfil.setValue(archivo);
    this.vistaPrevia = URL.createObjectURL(archivo);
    this.foto.set(this.vistaPrevia);
    this.quitarImagen = false;
  }

  protected quitarFoto() {
    this.form.controls.imagenPerfil.setValue(null);
    this.errorImagen.set(null);
    this.liberarVistaPrevia();
    this.foto.set(null);
    this.quitarImagen = true;
  }

  protected guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { imagenPerfil, ...datos } = this.form.getRawValue();
    const formData = new FormData();
    for (const [campo, valor] of Object.entries(datos)) formData.append(campo, valor.trim());
    if (imagenPerfil) formData.append('imagenPerfil', imagenPerfil);
    else if (this.quitarImagen) formData.append('quitarImagen', 'true');

    this.enviando.set(true);
    this.auth.editarPerfil(formData).subscribe({
      next: (usuario) => {
        this.enviando.set(false);
        this.guardado.emit(usuario);
        this.modal.abrir({
          tipo: 'exito',
          titulo: 'Perfil actualizado',
          mensaje: 'Tus datos se guardaron correctamente.',
        });
      },
      error: (error) => {
        this.enviando.set(false);
        this.modal.abrir({
          tipo: 'error',
          titulo: 'No se pudo guardar',
          mensaje: mensajeDeError(error),
        });
      },
    });
  }

  private liberarVistaPrevia() {
    if (this.vistaPrevia) URL.revokeObjectURL(this.vistaPrevia);
    this.vistaPrevia = null;
  }
}
