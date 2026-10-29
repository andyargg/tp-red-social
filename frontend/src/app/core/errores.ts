import { HttpErrorResponse } from '@angular/common/http';

// convierte un error de la API en un texto para mostrarle al usuario
export function mensajeDeError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) return 'Ocurrió un error inesperado.';
  if (error.status === 0) {
    return 'No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.';
  }
  const mensaje = error.error?.message;
  if (Array.isArray(mensaje)) return mensaje.join('\n');
  if (typeof mensaje === 'string') return mensaje;
  return 'Ocurrió un error inesperado.';
}
