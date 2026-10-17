import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TestataComponent } from '../testata/testata.component';

/** Pagina /aiuto, pubblica: le domande più comuni su iscrizioni, pagamenti e documenti. */
@Component({
  selector: 'app-aiuto',
  imports: [RouterLink, TestataComponent],
  templateUrl: './aiuto.component.html',
  styleUrl: './aiuto.component.scss',
})
export class AiutoComponent {}
