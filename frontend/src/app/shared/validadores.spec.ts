import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PASSWORD_REGEX, coinciden, fechaPasada, imagenValida } from './validadores';

describe('validadores', () => {
  it('la contraseña exige 8 caracteres, una mayúscula y un número', () => {
    const control = new FormControl('', Validators.pattern(PASSWORD_REGEX));
    for (const invalida of ['corta1A', 'sinmayuscula1', 'SinNumeros']) {
      control.setValue(invalida);
      expect(control.valid).toBe(false);
    }
    control.setValue('Valida123');
    expect(control.valid).toBe(true);
  });

  it('marca la confirmación cuando las contraseñas no coinciden', () => {
    const grupo = new FormGroup(
      { password: new FormControl('Valida123'), repetir: new FormControl('Otra1234') },
      { validators: coinciden('password', 'repetir') },
    );
    expect(grupo.controls.repetir.errors).toEqual({ noCoinciden: true });

    grupo.controls.repetir.setValue('Valida123');
    expect(grupo.controls.repetir.errors).toBeNull();
  });

  it('rechaza una fecha de nacimiento futura', () => {
    expect(fechaPasada(new FormControl('2999-01-01'))).toEqual({ fechaFutura: true });
    expect(fechaPasada(new FormControl('2000-01-01'))).toBeNull();
  });

  it('rechaza archivos que no son imagen o pesan más de 5 MB', () => {
    const texto = new File(['hola'], 'notas.txt', { type: 'text/plain' });
    const pesada = new File([new Uint8Array(6 * 1024 * 1024)], 'foto.png', { type: 'image/png' });
    const valida = new File(['x'], 'foto.png', { type: 'image/png' });

    expect(imagenValida(new FormControl(texto))).toEqual({ tipoImagen: true });
    expect(imagenValida(new FormControl(pesada))).toEqual({ imagenPesada: true });
    expect(imagenValida(new FormControl(valida))).toBeNull();
  });
});
