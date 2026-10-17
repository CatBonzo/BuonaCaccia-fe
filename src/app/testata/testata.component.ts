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

  /** L'ultima parola del titolo e' l'accento in arancione, come nelle schermate di riferimento. */
  protected readonly accento = computed(() => this.titolo().split(' ').pop() ?? '');
  protected readonly inizio = computed(() => {
    const parole = this.titolo().split(' ');
    return parole.length > 1 ? parole.slice(0, -1).join(' ') + ' ' : '';
  });
}
