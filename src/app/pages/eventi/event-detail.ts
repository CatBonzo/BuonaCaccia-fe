import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, input, signal, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Api } from '../../api/api';
import { eventEnrollmentEnroll } from '../../api/fn/enrollments/event-enrollment-enroll';
import { eventGet } from '../../api/fn/events/event-get';
import { EventDto } from '../../api/models';
import { ApiError, ApiErrorDetail } from '../../core/api-error';
import { SessionService } from '../../core/session.service';
import { AVAILABILITY_LABELS, CATEGORY_LABELS, LEVEL_LABELS, OBLIGATION_LABELS, STATUS_LABELS, label } from '../../core/labels';

/** Dettaglio di un evento: date, quota, posti, requisiti, adempimenti e referenti. */
@Component({
  selector: 'app-event-detail',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, CurrencyPipe, DatePipe, RouterLink, MatButtonModule, MatCardModule, MatChipsModule, MatListModule, MatProgressBarModule],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.scss',
})
export class EventDetail {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly session = inject(SessionService);

  /** Arriva dal percorso `/eventi/:id`. */
  readonly id = input.required<string>();

  protected readonly event = signal<EventDto | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly notFound = signal(false);
  protected readonly enrolling = signal(false);
  /** Perche' l'iscrizione e' stata rifiutata: messaggio e, se ci sono, i motivi uno per uno. */
  protected readonly enrollError = signal<{ message: string; details: ApiErrorDetail[] } | null>(null);

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

  /** Le iscrizioni si possono tentare solo a eventi aperti; il backend decide comunque l'ultima parola. */
  protected canEnroll(event: EventDto): boolean {
    return event.availability === 'OPEN' || event.availability === 'LIMITED' || event.availability === 'HEAVY_OVERBOOKING';
  }

  /** Codice socio del ragazzo che un capo iscrive come presentatore. */
  protected memberCode = '';

  protected enroll(event: EventDto, memberCode?: string): void {
    this.enrolling.set(true);
    this.enrollError.set(null);
    this.api.invoke(eventEnrollmentEnroll, { eventId: event.id!, body: memberCode ? { memberCode } : {} }).then(
      (response) => {
        const waiting = response.payload?.position === 'WAITING';
        this.snackBar.open(waiting ? 'Sei in lista d\u2019attesa.' : 'Iscrizione registrata: completa gli adempimenti.', 'Chiudi', { duration: 6000 });
        void this.router.navigate([memberCode ? '/capi/iscritti' : '/iscrizioni']);
      },
      (e: ApiError) => {
        this.enrolling.set(false);
        this.enrollError.set({ message: e.message, details: e.details });
      },
    );
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
