import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SegreteriaEventiRoutingModule } from './segreteria-eventi-routing.module';
import { SegreteriaEventiComponent } from './segreteria-eventi.component';

/** Modulo della pagina: si carica solo quando serve (lazy) e porta con se' il componente e la sua rotta. */
@NgModule({
  imports: [CommonModule, SegreteriaEventiRoutingModule, SegreteriaEventiComponent],
})
export class SegreteriaEventiModule {}
