import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AmministrazioneTipiEventoRoutingModule } from './amministrazione-tipi-evento-routing.module';
import { AmministrazioneTipiEventoComponent } from './amministrazione-tipi-evento.component';

/** Modulo della pagina: si carica solo quando serve (lazy) e porta con se' il componente e la sua rotta. */
@NgModule({
  imports: [CommonModule, AmministrazioneTipiEventoRoutingModule, AmministrazioneTipiEventoComponent],
})
export class AmministrazioneTipiEventoModule {}
