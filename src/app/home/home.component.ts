import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Api } from '../api/api';
import { eventSearch } from '../api/fn/events/event-search';
import { EventDto } from '../api/models';
import { ApiError } from '../core/api-error';
import { EventoCardComponent } from '../evento-card/evento-card.component';
import { StatoVuotoComponent } from '../stato-vuoto/stato-vuoto.component';
import { TestataComponent } from '../testata/testata.component';

/** Quante carte mostra la Home: bastano a dare un'idea, il resto sta nella pagina Eventi. */
const FEATURED = 3;

/** Pagina `/`, pubblica: il saluto, i prossimi eventi come carte e sotto qualche parola su come funziona. */
@Component({
  selector: 'app-home',
  imports: [RouterLink, MatButtonModule, MatProgressBarModule, TestataComponent, EventoCardComponent, StatoVuotoComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly api = inject(Api);

  protected readonly events = signal<EventDto[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.api.invoke(eventSearch, { page: 0, size: FEATURED, sort: 'startDate,asc' }).then(
      (response) => {
        this.events.set(response.payload?.content ?? []);
        this.loading.set(false);
      },
      (e: ApiError) => {
        this.error.set(e.message);
        this.loading.set(false);
      },
    );
  }
}
