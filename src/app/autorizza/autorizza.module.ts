import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AutorizzaRoutingModule } from './autorizza-routing.module';
import { AutorizzaComponent } from './autorizza.component';

/** Modulo della pagina: si carica solo quando serve (lazy) e porta con se' il componente e la sua rotta. */
@NgModule({
  imports: [CommonModule, AutorizzaRoutingModule, AutorizzaComponent],
})
export class AutorizzaModule {}
