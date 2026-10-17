import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SegreteriaRimborsiRoutingModule } from './segreteria-rimborsi-routing.module';
import { SegreteriaRimborsiComponent } from './segreteria-rimborsi.component';

/** Modulo della pagina: si carica solo quando serve (lazy) e porta con se' il componente e la sua rotta. */
@NgModule({
  imports: [CommonModule, SegreteriaRimborsiRoutingModule, SegreteriaRimborsiComponent],
})
export class SegreteriaRimborsiModule {}
