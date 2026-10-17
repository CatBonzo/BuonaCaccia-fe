import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiutoRoutingModule } from './aiuto-routing.module';
import { AiutoComponent } from './aiuto.component';

/** Modulo della pagina: si carica solo quando serve (lazy) e porta con se' il componente e la sua rotta. */
@NgModule({
  imports: [CommonModule, AiutoRoutingModule, AiutoComponent],
})
export class AiutoModule {}
