import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Piede della pagina: dice con onesta' cos'e' questo sito. */
@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  protected readonly year = new Date().getFullYear();
}
