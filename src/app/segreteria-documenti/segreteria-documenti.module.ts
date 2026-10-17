import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SegreteriaDocumentiRoutingModule } from './segreteria-documenti-routing.module';
import { SegreteriaDocumentiComponent } from './segreteria-documenti.component';

/** Modulo della pagina: si carica solo quando serve (lazy) e porta con se' il componente e la sua rotta. */
@NgModule({
  imports: [CommonModule, SegreteriaDocumentiRoutingModule, SegreteriaDocumentiComponent],
})
export class SegreteriaDocumentiModule {}
