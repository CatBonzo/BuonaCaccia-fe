import { DatePipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Api } from '../api/api';
import { enrollmentSatisfy } from '../api/fn/enrollments/enrollment-satisfy';
import { eventEnrollmentList, EventEnrollmentList$Params } from '../api/fn/enrollments/event-enrollment-list';
import { eventManaged } from '../api/fn/events/event-managed';
import { EnrollmentDto, EnrollmentObligationDto, EventDto } from '../api/models';
import { ApiError } from '../core/api-error';
import { ENROLLMENT_STATUS_LABELS, OBLIGATION_LABELS, OBLIGATION_STATUS_LABELS, label } from '../core/labels';

const PAGE_SIZE = 12;

/** Le iscrizioni di un evento della propria regione e gli adempimenti che la segreteria può segnare come fatti. */
@Component({
  selector: 'app-segreteria-iscrizioni',
  imports: [
    DatePipe, FormsModule, MatButtonModule, MatCardModule, MatChipsModule, MatFormFieldModule, MatPaginatorModule,
    MatProgressBarModule, MatSelectModule,
  ],
  templateUrl: './segreteria-iscrizioni.component.html',
  styleUrl: './segreteria-iscrizioni.component.scss',
})
export class SegreteriaIscrizioniComponent {
  private readonly api = inject(Api);
  private readonly snackBar = inject(MatSnackBar);

  /** Evento scelto dall'indirizzo (`?evento=`), per arrivarci da altre pagine. */
  readonly evento = input<string>();

  protected readonly events = signal<EventDto[]>([]);
  protected readonly enrollments = signal<EnrollmentDto[]>([]);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly statuses = Object.entries(ENROLLMENT_STATUS_LABELS);
  protected readonly labelOf = label;
  protected readonly statusLabels = ENROLLMENT_STATUS_LABELS;
  protected readonly obligationLabels = OBLIGATION_LABELS;
  protected readonly obligationStatusLabels = OBLIGATION_STATUS_LABELS;
  protected readonly pageSize = PAGE_SIZE;
  protected eventId = '';
  protected status = '';
  protected position = '';

  constructor() {
    this.api.invoke(eventManaged, { size: 100, sort: 'createdAt,desc' }).then(
      (r) => this.events.set((r.payload?.content ?? []).filter((e) => e.status !== 'DRAFT')),
      (e: ApiError) => this.error.set(e.message),
    );
    effect(() => {
      const preset = this.evento();
      if (preset && preset !== this.eventId) {
        this.eventId = preset;
        this.load(0);
      }
    });
  }

  protected filter(): void {
    this.load(0);
  }

  protected onPage(event: PageEvent): void {
    this.load(event.pageIndex);
  }

  /** La segreteria segna a mano ciò che non passa da un'altra schermata: il pagamento ha la sua. */
  protected canSatisfy(e: EnrollmentDto, o: EnrollmentObligationDto): boolean {
    return !!e.availableActions?.includes('SATISFY') && o.status === 'TODO' && o.type !== 'PAYMENT';
  }

  protected satisfy(e: EnrollmentDto, o: EnrollmentObligationDto): void {
    this.error.set(null);
    this.api.invoke(enrollmentSatisfy, { id: e.id!, type: o.type!, code: o.type === 'DOCUMENT' ? o.code : undefined }).then(
      () => {
        this.snackBar.open('Adempimento segnato come soddisfatto.', 'Chiudi', { duration: 4000 });
        this.load(this.pageIndex());
      },
      (err: ApiError) => this.error.set(err.details.length ? err.details.map((d) => d.message).join(' ') : err.message),
    );
  }

  private load(page: number): void {
    if (!this.eventId) {
      this.enrollments.set([]);
      this.total.set(0);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const params: EventEnrollmentList$Params = { eventId: this.eventId, page, size: PAGE_SIZE };
    if (this.status) params.status = this.status as EventEnrollmentList$Params['status'];
    if (this.position) params.position = this.position as EventEnrollmentList$Params['position'];
    this.api.invoke(eventEnrollmentList, params).then(
      (response) => {
        this.enrollments.set(response.payload?.content ?? []);
        this.total.set(response.payload?.totalElements ?? 0);
        this.pageIndex.set(response.payload?.page ?? page);
        this.loading.set(false);
      },
      (e: ApiError) => {
        this.error.set(e.message);
        this.loading.set(false);
      },
    );
  }
}
