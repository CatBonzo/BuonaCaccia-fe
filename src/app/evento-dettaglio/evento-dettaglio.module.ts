import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventoDettaglioRoutingModule } from './evento-dettaglio-routing.module';
import { EventoDettaglioComponent } from './evento-dettaglio.component';

/** Modulo della pagina: si carica solo quando serve (lazy) e porta con se' il componente e la sua rotta. */
@NgModule({
  imports: [CommonModule, EventoDettaglioRoutingModule, EventoDettaglioComponent],
})
export class EventoDettaglioModule {}
