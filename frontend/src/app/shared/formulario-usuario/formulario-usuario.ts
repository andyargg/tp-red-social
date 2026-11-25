import {
  Component,
  OnDestroy,
  booleanAttribute,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Perfil } from '../../core/usuario';
import { Avatar } from '../avatar';
import { AutofocoDirective } from '../directivas/autofoco.directive';
import { Icono, NombreIcono } from '../icono';
import {
  CORREO_REGEX,
  FECHA_MINIMA,
  NOMBRE_USUARIO_REGEX,
  PASSWORD_REGEX,
  coinciden,
  fechaPasada,
  hoyLocal,
  obligatorio,
  problemaDeImagen,
} from '../validadores';

@Component({
  selector: 'app-formulario-usuario',
  imports: [ReactiveFormsModule, Avatar, Icono, AutofocoDirective],
  templateUrl: './formulario-usuario.html',
  styleUrl: './formulario-usuario.scss',
})
export class FormularioUsuario implements OnDestroy {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly conPerfil = input(false, { transform: booleanAttribute });
  readonly autofoco = input(false, { transform: booleanAttribute });
  readonly enviando = input(false);
  readonly textoBoton = input('Crear cuenta');
  readonly textoEnviando = input('Creando cuenta…');
  readonly icono = input<NombreIcono>('registrarse');
  readonly enviado = output<FormData>();

  protected readonly vistaPrevia = signal<string | null>(null);
  protected readonly errorImagen = signal<string | null>(null);
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
      perfil: this.fb.control<Perfil>('usuario'),
      imagenPerfil: this.fb.control<File | null>(null),
    },
    { validators: coinciden('password', 'repetirPassword') },
  );

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
    const valido = problema ? null : archivo;
    this.form.controls.imagenPerfil.setValue(valido);
    this.mostrarVistaPrevia(valido);
  }

  protected enviar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { repetirPassword, imagenPerfil, perfil, ...datos } = this.form.getRawValue();
    const formData = new FormData();
    for (const [campo, valor] of Object.entries(datos)) {
      formData.append(campo, campo === 'password' ? valor : valor.trim());
    }
    if (this.conPerfil()) formData.append('perfil', perfil);
    if (imagenPerfil) formData.append('imagenPerfil', imagenPerfil);
    this.enviado.emit(formData);
  }

  reiniciar() {
    this.form.reset();
    this.errorImagen.set(null);
    this.mostrarVistaPrevia(null);
  }

  ngOnDestroy() {
    this.mostrarVistaPrevia(null);
  }

  private mostrarVistaPrevia(archivo: File | null) {
    const anterior = this.vistaPrevia();
    if (anterior) URL.revokeObjectURL(anterior);
    this.vistaPrevia.set(archivo ? URL.createObjectURL(archivo) : null);
  }
}
