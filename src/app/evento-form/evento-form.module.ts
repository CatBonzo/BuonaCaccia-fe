import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventoFormRoutingModule } from './evento-form-routing.module';
import { EventoFormComponent } from './evento-form.component';

/** Modulo della pagina: si carica solo quando serve (lazy) e porta con se' il componente e la sua rotta. */
@NgModule({
  imports: [CommonModule, EventoFormRoutingModule, EventoFormComponent],
})
export class EventoFormModule {}
