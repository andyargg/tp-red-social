import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// al menos 8 caracteres, una mayúscula y un número (igual que el backend)
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
export const NOMBRE_USUARIO_REGEX = /^[a-zA-Z0-9._]{3,20}$/;

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

export function fechaPasada(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  return new Date(control.value) < new Date() ? null : { fechaFutura: true };
}

export function imagenValida(control: AbstractControl<File | null>): ValidationErrors | null {
  const archivo = control.value;
  if (!archivo) return null;
  if (!TIPOS_IMAGEN.includes(archivo.type)) return { tipoImagen: true };
  if (archivo.size > TAMANIO_MAXIMO_IMAGEN) return { imagenPesada: true };
  return null;
}
