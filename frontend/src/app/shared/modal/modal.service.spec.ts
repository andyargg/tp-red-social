import { ModalService } from './modal.service';

describe('ModalService', () => {
  it('confirmar se resuelve en true al aceptar y en false al cancelar', async () => {
    const modal = new ModalService();

    const aceptado = modal.confirmar({ titulo: '¿Seguro?', mensaje: '' });
    expect(modal.actual()?.textoCancelar).toBe('Cancelar');
    modal.cerrar(true);
    expect(await aceptado).toBe(true);
    expect(modal.actual()).toBeNull();

    const cancelado = modal.confirmar({ titulo: '¿Seguro?', mensaje: '' });
    modal.cerrar();
    expect(await cancelado).toBe(false);
  });

  it('abrir otro modal cancela el anterior', async () => {
    const modal = new ModalService();
    const primero = modal.confirmar({ titulo: 'Primero', mensaje: '' });
    modal.abrir({ titulo: 'Segundo', mensaje: '' });
    expect(await primero).toBe(false);
    expect(modal.actual()?.titulo).toBe('Segundo');
  });
});
