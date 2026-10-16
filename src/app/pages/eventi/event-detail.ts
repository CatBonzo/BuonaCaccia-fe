import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, input, signal, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Api } from '../../api/api';
import { eventGet } from '../../api/fn/events/event-get';
import { EventDto } from '../../api/models';
import { ApiError } from '../../core/api-error';
import { AVAILABILITY_LABELS, CATEGORY_LABELS, LEVEL_LABELS, OBLIGATION_LABELS, STATUS_LABELS, label } from '../../core/labels';

/** Dettaglio di un evento: date, quota, posti, requisiti, adempimenti e referenti. */
@Component({
  selector: 'app-event-detail',
  imports: [CurrencyPipe, DatePipe, RouterLink, MatButtonModule, MatCardModule, MatChipsModule, MatListModule, MatProgressBarModule],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.scss',
})
export class EventDetail {
  private readonly api = inject(Api);

  /** Arriva dal percorso `/eventi/:id`. */
  readonly id = input.required<string>();

  protected readonly event = signal<EventDto | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly notFound = signal(false);

  protected readonly labelOf = label;
  protected readonly categoryLabels = CATEGORY_LABELS;
  protected readonly availabilityLabels = AVAILABILITY_LABELS;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly levelLabels = LEVEL_LABELS;
  protected readonly obligationLabels = OBLIGATION_LABELS;

  constructor() {
    effect(() => this.load(this.id()));
  }

  protected seatsLeft(event: EventDto): number {
    return Math.max((event.seats ?? 0) - (event.enrolledCount ?? 0), 0);
  }

  private load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.notFound.set(false);
    this.api.invoke(eventGet, { id }).then(
      (response) => {
        this.event.set(response.payload ?? null);
        this.loading.set(false);
      },
      (e: ApiError) => {
        this.event.set(null);
        if (e.status === 404) this.notFound.set(true);
        else this.error.set(e.message);
        this.loading.set(false);
      },
    );
  }
}
