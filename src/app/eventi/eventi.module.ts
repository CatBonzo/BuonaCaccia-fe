import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventiRoutingModule } from './eventi-routing.module';
import { EventiComponent } from './eventi.component';

/** Modulo della pagina: si carica solo quando serve (lazy) e porta con se' il componente e la sua rotta. */
@NgModule({
  imports: [CommonModule, EventiRoutingModule, EventiComponent],
})
export class EventiModule {}
