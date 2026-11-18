import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
export const NOMBRE_USUARIO_REGEX = /^[a-zA-Z0-9._]{3,20}$/;
export const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const TAMANIO_MAXIMO_IMAGEN = 5 * 1024 * 1024;

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

export function obligatorio(control: AbstractControl<string | null>): ValidationErrors | null {
  return control.value?.trim() ? null : { required: true };
}

export function hoyLocal(): string {
  const hoy = new Date();
  const dosDigitos = (n: number) => String(n).padStart(2, '0');
  return `${hoy.getFullYear()}-${dosDigitos(hoy.getMonth() + 1)}-${dosDigitos(hoy.getDate())}`;
}

export const FECHA_MINIMA = '1900-01-01';

export function fechaPasada(control: AbstractControl<string | null>): ValidationErrors | null {
  if (!control.value) return null;
  if (control.value > hoyLocal()) return { fechaFutura: true };
  if (control.value < FECHA_MINIMA) return { fechaAntigua: true };
  return null;
}

export function problemaDeImagen(archivo: File): string | null {
  if (!TIPOS_IMAGEN.includes(archivo.type)) return 'La imagen debe ser JPG, PNG, WEBP o GIF.';
  if (archivo.size > TAMANIO_MAXIMO_IMAGEN) return 'La imagen puede pesar hasta 5 MB.';
  return null;
}
