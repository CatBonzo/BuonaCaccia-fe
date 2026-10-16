import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Api } from '../../api/api';
import { eventManaged } from '../../api/fn/events/event-managed';
import { paymentCancel } from '../../api/fn/payments/payment-cancel';
import { paymentRegister } from '../../api/fn/payments/payment-register';
import { eventPaymentExport } from '../../api/fn/reconciliation/event-payment-export';
import { eventPaymentReconciliation } from '../../api/fn/reconciliation/event-payment-reconciliation';
import { EventDto, Outstanding, PaymentDto, ReconciliationDto } from '../../api/models';
import { ApiError } from '../../core/api-error';
import { FileDownload } from '../../core/file-download';

/** Bonifici di un evento: chi deve ancora pagare, i pagamenti registrati (annullabili con motivo) e il CSV per la riconciliazione. */
@Component({
  selector: 'app-payments',
  imports: [
    CurrencyPipe, DatePipe, FormsModule, MatButtonModule, MatCardModule, MatChipsModule, MatFormFieldModule, MatInputModule,
    MatProgressBarModule, MatSelectModule,
  ],
  templateUrl: './payments.html',
  styleUrl: './payments.scss',
})
export class Payments {
  private readonly api = inject(Api);
  private readonly snackBar = inject(MatSnackBar);
  private readonly files = inject(FileDownload);

  /** Evento scelto dall'indirizzo (`?evento=`). */
  readonly evento = input<string>();

  protected readonly events = signal<EventDto[]>([]);
  protected readonly report = signal<ReconciliationDto | null>(null);
  protected readonly owing = signal<Outstanding[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected eventId = '';

  /** Iscrizione per cui si sta registrando un bonifico e i suoi campi. */
  protected readonly registering = signal<string | null>(null);
  protected amount: number | null = null;
  protected receivedOn = '';
  protected reference = '';

  /** Pagamento per cui si sta scrivendo il motivo dell'annullamento. */
  protected readonly cancelling = signal<string | null>(null);
  protected reason = '';

  constructor() {
    this.api.invoke(eventManaged, { size: 100, sort: 'createdAt,desc' }).then(
      (r) => this.events.set((r.payload?.content ?? []).filter((e) => e.status !== 'DRAFT' && (e.fee ?? 0) > 0)),
      (e: ApiError) => this.error.set(e.message),
    );
    effect(() => {
      const preset = this.evento();
      if (preset && preset !== this.eventId) {
        this.eventId = preset;
        this.load();
      }
    });
  }

  protected pick(): void {
    this.registering.set(null);
    this.cancelling.set(null);
    this.load();
  }

  protected startRegister(o: Outstanding): void {
    this.registering.set(o.enrollmentId!);
    this.amount = o.due ?? null;
    this.receivedOn = new Date().toISOString().slice(0, 10);
    this.reference = '';
  }

  protected register(o: Outstanding): void {
    this.error.set(null);
    const body = { amount: this.amount ?? 0, receivedOn: this.receivedOn, reference: this.reference.trim() || undefined };
    this.api.invoke(paymentRegister, { id: o.enrollmentId!, body }).then(
      () => {
        this.registering.set(null);
        this.snackBar.open('Bonifico registrato.', 'Chiudi', { duration: 4000 });
        this.load();
      },
      (err: ApiError) => this.error.set(err.details.length ? err.details.map((d) => d.message).join(' ') : err.message),
    );
  }

  protected startCancel(p: PaymentDto): void {
    this.cancelling.set(p.id!);
    this.reason = '';
  }

  protected cancel(p: PaymentDto): void {
    if (!this.reason.trim()) {
      this.error.set('Scrivi il motivo dell’annullamento.');
      return;
    }
    this.error.set(null);
    this.api.invoke(paymentCancel, { id: p.id!, body: { reason: this.reason.trim() } }).then(
      () => {
        this.cancelling.set(null);
        this.snackBar.open('Pagamento annullato.', 'Chiudi', { duration: 4000 });
        this.load();
      },
      (err: ApiError) => this.error.set(err.details.length ? err.details.map((d) => d.message).join(' ') : err.message),
    );
  }

  protected exportCsv(): void {
    this.api.invoke(eventPaymentExport, { eventId: this.eventId }).then(
      (csv) => this.files.save(csv, `riconciliazione-${this.eventId}.csv`),
      () => this.error.set('Non riesco a scaricare il CSV.'),
    );
  }

  private load(): void {
    if (!this.eventId) {
      this.report.set(null);
      this.owing.set([]);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.api.invoke(eventPaymentReconciliation, { eventId: this.eventId }).then(
      (reconciliation) => {
        this.report.set(reconciliation.payload ?? null);
        this.owing.set(reconciliation.payload?.outstanding ?? []);
        this.loading.set(false);
      },
      (e: ApiError) => {
        this.error.set(e.message);
        this.loading.set(false);
      },
    );
  }
}
