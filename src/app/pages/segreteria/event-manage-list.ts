import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Api } from '../../api/api';
import { eventCancel } from '../../api/fn/events/event-cancel';
import { eventCloseRegistrations } from '../../api/fn/events/event-close-registrations';
import { eventManaged, EventManaged$Params } from '../../api/fn/events/event-managed';
import { eventPublish } from '../../api/fn/events/event-publish';
import { EventDto } from '../../api/models';
import { ApiError } from '../../core/api-error';
import { STATUS_LABELS, label } from '../../core/labels';

const PAGE_SIZE = 12;

/** Gli eventi della propria regione, in qualunque stato, con le azioni consentite dallo stato. */
@Component({
  selector: 'app-event-manage-list',
  imports: [
    DatePipe, FormsModule, RouterLink, MatButtonModule, MatCardModule, MatChipsModule, MatFormFieldModule, MatInputModule,
    MatPaginatorModule, MatProgressBarModule, MatSelectModule,
  ],
  templateUrl: './event-manage-list.html',
  styleUrl: './event-manage-list.scss',
})
export class EventManageList {
  private readonly api = inject(Api);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly events = signal<EventDto[]>([]);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly statuses = Object.entries(STATUS_LABELS);
  protected readonly labelOf = label;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly pageSize = PAGE_SIZE;
  protected status = '';

  /** Evento per cui si sta scrivendo il motivo dell'annullamento. */
  protected readonly cancelling = signal<string | null>(null);
  protected reason = '';

  constructor() {
    this.load(0);
  }

  protected filter(): void {
    this.load(0);
  }

  protected onPage(event: PageEvent): void {
    this.load(event.pageIndex);
  }

  /** Il backend non indica le azioni possibili di un evento: si deducono dallo stato. */
  protected canPublish(e: EventDto): boolean {
    return e.status === 'DRAFT';
  }
  protected canClose(e: EventDto): boolean {
    return e.status === 'REGISTRATION_OPEN';
  }
  protected canCancel(e: EventDto): boolean {
    return e.status !== 'CANCELLED' && e.status !== 'COMPLETED';
  }

  protected publish(e: EventDto): void {
    this.act(this.api.invoke(eventPublish, { id: e.id!, body: { version: e.version } }), 'Evento pubblicato.');
  }

  protected close(e: EventDto): void {
    this.act(this.api.invoke(eventCloseRegistrations, { id: e.id!, body: { version: e.version } }), 'Iscrizioni chiuse.');
  }

  protected startCancel(e: EventDto): void {
    this.cancelling.set(e.id!);
    this.reason = '';
  }

  protected cancel(e: EventDto): void {
    if (!this.reason.trim()) {
      this.error.set('Scrivi il motivo dell’annullamento.');
      return;
    }
    this.act(this.api.invoke(eventCancel, { id: e.id!, body: { reason: this.reason.trim(), version: e.version! } }), 'Evento annullato.');
  }

  private act(request: Promise<unknown>, success: string): void {
    this.error.set(null);
    request.then(
      () => {
        this.cancelling.set(null);
        this.snackBar.open(success, 'Chiudi', { duration: 4000 });
        this.load(this.pageIndex());
      },
      (e: ApiError) => this.error.set(e.details.length ? e.details.map((d) => d.message).join(' ') : e.message),
    );
  }

  private load(page: number): void {
    this.loading.set(true);
    const params: EventManaged$Params = { page, size: PAGE_SIZE };
    if (this.status) params.status = this.status as EventManaged$Params['status'];
    this.api.invoke(eventManaged, params).then(
      (response) => {
        this.events.set(response.payload?.content ?? []);
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
