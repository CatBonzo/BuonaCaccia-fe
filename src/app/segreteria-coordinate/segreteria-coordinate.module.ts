import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SegreteriaCoordinateRoutingModule } from './segreteria-coordinate-routing.module';
import { SegreteriaCoordinateComponent } from './segreteria-coordinate.component';

/** Modulo della pagina: si carica solo quando serve (lazy) e porta con se' il componente e la sua rotta. */
@NgModule({
  imports: [CommonModule, SegreteriaCoordinateRoutingModule, SegreteriaCoordinateComponent],
})
export class SegreteriaCoordinateModule {}
