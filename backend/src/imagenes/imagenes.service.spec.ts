import { idPublico } from './imagenes.service.js';

describe('idPublico', () => {
  it('extrae el id público de una URL de Cloudinary de la app', () => {
    expect(
      idPublico(
        'https://res.cloudinary.com/demo/image/upload/v1712345678/red-social/perfiles/abc123.jpg',
      ),
    ).toBe('red-social/perfiles/abc123');
    expect(
      idPublico(
        'https://res.cloudinary.com/demo/image/upload/red-social/publicaciones/foto.png',
      ),
    ).toBe('red-social/publicaciones/foto');
  });

  it('ignora las URL que no son imágenes de la app', () => {
    expect(
      idPublico(
        'https://res.cloudinary.com/demo/image/upload/v1/otra/foto.png',
      ),
    ).toBeNull();
    expect(idPublico('https://ejemplo.com/foto.png')).toBeNull();
  });
});
