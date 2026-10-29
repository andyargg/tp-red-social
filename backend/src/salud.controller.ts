import { Controller, Get } from '@nestjs/common';

// lo usa Render para saber si el servicio está vivo
@Controller('salud')
export class SaludController {
  @Get()
  salud() {
    return { estado: 'ok' };
  }
}
