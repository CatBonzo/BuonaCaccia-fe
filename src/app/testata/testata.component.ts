import { Component, computed, input } from '@angular/core';

/** Testata di una pagina: grande saluto, una riga di spiegazione e, sotto, quello che la pagina vuole mettere (per esempio i filtri). */
@Component({
  selector: 'app-testata',
  templateUrl: './testata.component.html',
  styleUrl: './testata.component.scss',
})
export class TestataComponent {
  readonly titolo = input.required<string>();
  readonly introduzione = input<string>('');
  /** `scura`: blu notte con le curve di livello (Home). `chiara`: titolo blu su carta con la bussola (Eventi). */
  readonly variante = input<'scura' | 'chiara'>('scura');
  /** Quante parole in fondo al titolo vanno in arancione. */
  readonly paroleAccento = input(1);

  /** Le ultime parole del titolo sono l'accento in arancione, come nelle schermate di riferimento. */
  protected readonly accento = computed(() => this.titolo().split(' ').slice(-this.paroleAccento()).join(' '));
  protected readonly inizio = computed(() => {
    const parole = this.titolo().split(' ');
    return parole.length > this.paroleAccento() ? parole.slice(0, -this.paroleAccento()).join(' ') + ' ' : '';
  });
}
