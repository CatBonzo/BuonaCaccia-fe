import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchedaRoutingModule } from './scheda-routing.module';
import { SchedaComponent } from './scheda.component';

/** Modulo della pagina: si carica solo quando serve (lazy) e porta con se' il componente e la sua rotta. */
@NgModule({
  imports: [CommonModule, SchedaRoutingModule, SchedaComponent],
})
export class SchedaModule {}
