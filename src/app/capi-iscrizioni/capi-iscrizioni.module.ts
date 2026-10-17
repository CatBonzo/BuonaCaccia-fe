import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CapiIscrizioniRoutingModule } from './capi-iscrizioni-routing.module';
import { CapiIscrizioniComponent } from './capi-iscrizioni.component';

/** Modulo della pagina: si carica solo quando serve (lazy) e porta con se' il componente e la sua rotta. */
@NgModule({
  imports: [CommonModule, CapiIscrizioniRoutingModule, CapiIscrizioniComponent],
})
export class CapiIscrizioniModule {}
