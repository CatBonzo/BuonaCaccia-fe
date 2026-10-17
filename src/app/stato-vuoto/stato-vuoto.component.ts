import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Schermata vuota: dice cosa e' successo e cosa si puo' fare, senza lasciare la pagina bianca. */
@Component({
  selector: 'app-stato-vuoto',
  imports: [MatIconModule],
  templateUrl: './stato-vuoto.component.html',
  styleUrl: './stato-vuoto.component.scss',
})
export class StatoVuotoComponent {
  readonly icona = input('inbox');
  readonly titolo = input.required<string>();
  readonly suggerimento = input<string>('');
}
