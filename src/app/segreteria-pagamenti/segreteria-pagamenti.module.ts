import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SegreteriaPagamentiRoutingModule } from './segreteria-pagamenti-routing.module';
import { SegreteriaPagamentiComponent } from './segreteria-pagamenti.component';

/** Modulo della pagina: si carica solo quando serve (lazy) e porta con se' il componente e la sua rotta. */
@NgModule({
  imports: [CommonModule, SegreteriaPagamentiRoutingModule, SegreteriaPagamentiComponent],
})
export class SegreteriaPagamentiModule {}
