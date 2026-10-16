import { Component, input } from '@angular/core';

/** Testata di una pagina: grande saluto, una riga di spiegazione e, sotto, quello che la pagina vuole mettere (per esempio i filtri). */
@Component({
  selector: 'app-testata',
  templateUrl: './testata.component.html',
  styleUrl: './testata.component.scss',
})
export class TestataComponent {
  readonly titolo = input.required<string>();
  readonly introduzione = input<string>('');
}
