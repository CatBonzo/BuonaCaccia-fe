import { Component, input } from '@angular/core';

/** Schermata vuota: dice cosa e' successo e cosa si puo' fare, senza lasciare la pagina bianca. */
@Component({
  selector: 'app-stato-vuoto',
  templateUrl: './stato-vuoto.component.html',
  styleUrl: './stato-vuoto.component.scss',
})
export class StatoVuotoComponent {
  /** Icona PrimeIcons, per esempio `fa-inbox`. */
  readonly icona = input('fa-inbox');
  readonly titolo = input.required<string>();
  readonly suggerimento = input<string>('');
}
