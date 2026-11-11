import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// al menos 8 caracteres, una mayúscula y un número (igual que el backend)
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
export const NOMBRE_USUARIO_REGEX = /^[a-zA-Z0-9._]{3,20}$/;
// exige dominio con punto (ana@mail.com), igual que el backend; Validators.email acepta "ana@mail"
export const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const TAMANIO_MAXIMO_IMAGEN = 5 * 1024 * 1024;

// validador de grupo: los dos campos deben coincidir
export function coinciden(campo: string, confirmacion: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const control = grupo.get(confirmacion);
    if (!control) return null;
    const iguales = grupo.get(campo)?.value === control.value;
    const errores = { ...control.errors };
    delete errores['noCoinciden'];
    if (!iguales && control.value) errores['noCoinciden'] = true;
    control.setErrors(Object.keys(errores).length ? errores : null);
    return null;
  };
}

// como Validators.required, pero un texto de solo espacios también cuenta como vacío
// (el backend recorta los espacios antes de validar)
export function obligatorio(control: AbstractControl<string | null>): ValidationErrors | null {
  return control.value?.trim() ? null : { required: true };
}

// fecha de hoy "AAAA-MM-DD" en la hora local (toISOString usa UTC y a la noche ya es mañana)
export function hoyLocal(): string {
  const hoy = new Date();
  const dosDigitos = (n: number) => String(n).padStart(2, '0');
  return `${hoy.getFullYear()}-${dosDigitos(hoy.getMonth() + 1)}-${dosDigitos(hoy.getDate())}`;
}

export const FECHA_MINIMA = '1900-01-01';

// los valores "AAAA-MM-DD" se pueden comparar como texto
export function fechaPasada(control: AbstractControl<string | null>): ValidationErrors | null {
  if (!control.value) return null;
  if (control.value > hoyLocal()) return { fechaFutura: true };
  if (control.value < FECHA_MINIMA) return { fechaAntigua: true };
  return null;
}

export function imagenValida(control: AbstractControl<File | null>): ValidationErrors | null {
  const archivo = control.value;
  if (!archivo) return null;
  if (!TIPOS_IMAGEN.includes(archivo.type)) return { tipoImagen: true };
  if (archivo.size > TAMANIO_MAXIMO_IMAGEN) return { imagenPesada: true };
  return null;
}
