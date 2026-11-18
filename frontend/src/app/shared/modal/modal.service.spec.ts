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

  it('un modal pedido mientras hay otro abierto espera su turno', async () => {
    const modal = new ModalService();
    const primero = modal.confirmar({ titulo: 'Primero', mensaje: '' });
    const segundo = modal.abrir({ titulo: 'Segundo', mensaje: '' });
    expect(modal.actual()?.titulo).toBe('Primero');

    modal.cerrar(true);
    expect(await primero).toBe(true);
    expect(modal.actual()?.titulo).toBe('Segundo');
    modal.cerrar(true);
    expect(await segundo).toBe(true);
    expect(modal.actual()).toBeNull();
  });

  it('descartar cancela un modal abierto o en espera', async () => {
    const modal = new ModalService();
    const abierto = modal.abrir({ titulo: 'Aviso', mensaje: '' });
    const otro = modal.abrir({ titulo: 'Otro', mensaje: '' });
    const enEspera = modal.abrir({ titulo: 'Aviso', mensaje: '' });

    modal.descartar('Aviso');
    expect(await abierto).toBe(false);
    expect(await enEspera).toBe(false);
    expect(modal.actual()?.titulo).toBe('Otro');
    modal.cerrar();
    expect(await otro).toBe(false);
    expect(modal.actual()).toBeNull();
  });
});
