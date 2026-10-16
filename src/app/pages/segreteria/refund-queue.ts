import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { eventManaged } from '../../api/fn/events/event-managed';
import { refundIssue } from '../../api/fn/refunds/refund-issue';
import { refundList, RefundList$Params } from '../../api/fn/refunds/refund-list';
import { refundReject } from '../../api/fn/refunds/refund-reject';
import { refundTake } from '../../api/fn/refunds/refund-take';
import { EventDto, RefundDto } from '../../api/models';
import { ApiError } from '../../core/api-error';
import { CLOSING_REASON_LABELS, REFUND_STATUS_LABELS, label } from '../../core/labels';

const PAGE_SIZE = 12;

/** Rimborsi della propria regione, dal più vecchio: la segreteria li prende in carico, li segna emessi (data e riferimento) o li rifiuta con un motivo. */
@Component({
  selector: 'app-refund-queue',
  imports: [
    CurrencyPipe, DatePipe, FormsModule, MatButtonModule, MatCardModule, MatChipsModule, MatFormFieldModule, MatInputModule,
    MatPaginatorModule, MatProgressBarModule, MatSelectModule,
  ],
  templateUrl: './refund-queue.html',
  styleUrl: './refund-queue.scss',
})
export class RefundQueue {
  private readonly api = inject(Api);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly events = signal<EventDto[]>([]);
  protected readonly refunds = signal<RefundDto[]>([]);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly statuses = Object.entries(REFUND_STATUS_LABELS);
  protected readonly labelOf = label;
  protected readonly statusLabels = REFUND_STATUS_LABELS;
  protected readonly closingLabels = CLOSING_REASON_LABELS;
  protected readonly pageSize = PAGE_SIZE;
  protected status = 'REQUESTED';
  protected eventId = '';

  /** Rimborso che si sta emettendo (con data e riferimento) o rifiutando (con motivo). */
  protected readonly issuing = signal<string | null>(null);
  protected readonly rejecting = signal<string | null>(null);
  protected issuedOn = '';
  protected reference = '';
  protected reason = '';

  constructor() {
    this.api.invoke(eventManaged, { size: 100, sort: 'createdAt,desc' }).then(
      (r) => this.events.set((r.payload?.content ?? []).filter((e) => e.status !== 'DRAFT')),
      () => undefined,
    );
    this.load(0);
  }

  protected filter(): void {
    this.load(0);
  }

  protected onPage(event: PageEvent): void {
    this.load(event.pageIndex);
  }

  protected take(r: RefundDto): void {
    this.act(this.api.invoke(refundTake, { id: r.id! }), 'Rimborso preso in carico.');
  }

  protected startIssue(r: RefundDto): void {
    this.rejecting.set(null);
    this.issuing.set(r.id!);
    this.issuedOn = new Date().toISOString().slice(0, 10);
    this.reference = '';
  }

  protected issue(r: RefundDto): void {
    this.act(
      this.api.invoke(refundIssue, { id: r.id!, body: { issuedOn: this.issuedOn, reference: this.reference.trim() || undefined } }),
      'Rimborso segnato come emesso.',
    );
  }

  protected startReject(r: RefundDto): void {
    this.issuing.set(null);
    this.rejecting.set(r.id!);
    this.reason = '';
  }

  protected reject(r: RefundDto): void {
    if (!this.reason.trim()) {
      this.error.set('Scrivi il motivo del rifiuto: lo vede chi aveva chiesto il rimborso.');
      return;
    }
    this.act(this.api.invoke(refundReject, { id: r.id!, body: { reason: this.reason.trim() } }), 'Rimborso rifiutato.');
  }

  private act(request: Promise<unknown>, success: string): void {
    this.error.set(null);
    request.then(
      () => {
        this.issuing.set(null);
        this.rejecting.set(null);
        this.snackBar.open(success, 'Chiudi', { duration: 4000 });
        this.load(this.pageIndex());
      },
      (e: ApiError) => this.error.set(e.details.length ? e.details.map((d) => d.message).join(' ') : e.message),
    );
  }

  private load(page: number): void {
    this.loading.set(true);
    const params: RefundList$Params = { page, size: PAGE_SIZE };
    if (this.status) params.status = this.status as RefundList$Params['status'];
    if (this.eventId) params.eventId = this.eventId;
    this.api.invoke(refundList, params).then(
      (response) => {
        this.refunds.set(response.payload?.content ?? []);
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
