import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SegreteriaIscrizioniRoutingModule } from './segreteria-iscrizioni-routing.module';
import { SegreteriaIscrizioniComponent } from './segreteria-iscrizioni.component';

/** Modulo della pagina: si carica solo quando serve (lazy) e porta con se' il componente e la sua rotta. */
@NgModule({
  imports: [CommonModule, SegreteriaIscrizioniRoutingModule, SegreteriaIscrizioniComponent],
})
export class SegreteriaIscrizioniModule {}
