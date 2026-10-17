import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IscrizioniRoutingModule } from './iscrizioni-routing.module';
import { IscrizioniComponent } from './iscrizioni.component';

/** Modulo della pagina: si carica solo quando serve (lazy) e porta con se' il componente e la sua rotta. */
@NgModule({
  imports: [CommonModule, IscrizioniRoutingModule, IscrizioniComponent],
})
export class IscrizioniModule {}
