import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home.component';

/** Modulo della pagina: si carica solo quando serve (lazy) e porta con se' il componente e la sua rotta. */
@NgModule({
  imports: [CommonModule, HomeRoutingModule, HomeComponent],
})
export class HomeModule {}
