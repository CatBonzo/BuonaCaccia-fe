import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TestataComponent } from '../testata/testata.component';

/** Pagina /info, pubblica: cos'è il progetto e chi può fare cosa. */
@Component({
  selector: 'app-info',
  imports: [RouterLink, TestataComponent],
  templateUrl: './info.component.html',
  styleUrl: './info.component.scss',
})
export class InfoComponent {}
