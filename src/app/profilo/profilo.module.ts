import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfiloRoutingModule } from './profilo-routing.module';
import { ProfiloComponent } from './profilo.component';

/** Modulo della pagina: si carica solo quando serve (lazy) e porta con se' il componente e la sua rotta. */
@NgModule({
  imports: [CommonModule, ProfiloRoutingModule, ProfiloComponent],
})
export class ProfiloModule {}
