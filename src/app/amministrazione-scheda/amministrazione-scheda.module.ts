import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AmministrazioneSchedaRoutingModule } from './amministrazione-scheda-routing.module';
import { AmministrazioneSchedaComponent } from './amministrazione-scheda.component';

/** Modulo della pagina: si carica solo quando serve (lazy) e porta con se' il componente e la sua rotta. */
@NgModule({
  imports: [CommonModule, AmministrazioneSchedaRoutingModule, AmministrazioneSchedaComponent],
})
export class AmministrazioneSchedaModule {}
