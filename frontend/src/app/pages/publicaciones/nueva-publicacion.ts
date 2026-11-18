import { Component, DestroyRef, inject, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { mensajeDeError } from '../../core/errores';
import { Publicacion } from '../../core/publicacion';
import { PublicacionesService } from '../../core/publicaciones.service';
import { Icono } from '../../shared/icono';
import { ModalService } from '../../shared/modal/modal.service';
import { obligatorio, problemaDeImagen } from '../../shared/validadores';

@Component({
  selector: 'app-nueva-publicacion',
  imports: [ReactiveFormsModule, Icono],
  templateUrl: './nueva-publicacion.html',
  styleUrls: ['../auth.scss', './nueva-publicacion.scss'],
})
export class NuevaPublicacion {
  private readonly servicio = inject(PublicacionesService);
  private readonly modal = inject(ModalService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly creada = output<Publicacion>();
  readonly cancelada = output<void>();

  protected readonly enviando = signal(false);
  protected readonly vistaPrevia = signal<string | null>(null);
  protected readonly errorImagen = signal<string | null>(null);

  protected readonly form = this.fb.group({
    titulo: ['', [obligatorio, Validators.maxLength(100)]],
    mensaje: ['', [obligatorio, Validators.maxLength(1000)]],
    imagen: this.fb.control<File | null>(null),
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      const vista = this.vistaPrevia();
      if (vista) URL.revokeObjectURL(vista);
    });
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
    this.cambiarImagen(problema ? null : archivo);
    this.errorImagen.set(problema);
  }

  protected cambiarImagen(archivo: File | null) {
    this.form.controls.imagen.setValue(archivo);
    if (!archivo) this.errorImagen.set(null);
    const anterior = this.vistaPrevia();
    if (anterior) URL.revokeObjectURL(anterior);
    this.vistaPrevia.set(archivo ? URL.createObjectURL(archivo) : null);
  }

  protected publicar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { titulo, mensaje, imagen } = this.form.getRawValue();
    const datos = new FormData();
    datos.append('titulo', titulo.trim());
    datos.append('mensaje', mensaje.trim());
    if (imagen) datos.append('imagen', imagen);

    this.enviando.set(true);
    this.servicio.crear(datos).subscribe({
      next: (publicacion) => {
        this.enviando.set(false);
        this.form.reset();
        this.cambiarImagen(null);
        this.creada.emit(publicacion);
        this.modal.abrir({
          tipo: 'exito',
          titulo: '¡Publicado!',
          mensaje: `"${publicacion.titulo}" ya está visible para toda la red.`,
        });
      },
      error: (error) => {
        this.enviando.set(false);
        this.modal.abrir({
          tipo: 'error',
          titulo: 'No se pudo publicar',
          mensaje: mensajeDeError(error),
        });
      },
    });
  }
}
