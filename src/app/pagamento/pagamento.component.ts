import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ButtonModule } from '@openng/optimus-ui/button';
import { DialogModule } from '@openng/optimus-ui/dialog';
import { InputMaskModule } from '@openng/optimus-ui/inputmask';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { MessageModule } from '@openng/optimus-ui/message';
import { PanelModule } from '@openng/optimus-ui/panel';
import { TagModule } from '@openng/optimus-ui/tag';
import { Api } from '../api/api';
import { enrollmentGet } from '../api/fn/enrollments/enrollment-get';
import { paymentPayByCard } from '../api/fn/payments/payment-pay-by-card';
import { EnrollmentDto } from '../api/models';
import { ApiError } from '../core/api-error';

/** La carta salvata: del numero si tiene solo la fine, mai il numero intero ne' il codice di sicurezza. */
interface SavedCard {
  last4: string;
  holder: string;
  expiry: string;
}

/** La pagina del pagamento di un'iscrizione: quota, versato, residuo e coordinate del bonifico. */
@Component({
  selector: 'app-pagamento',
  imports: [
    CurrencyPipe, DatePipe, FormsModule, RouterLink, MatButtonModule, MatProgressBarModule, ButtonModule, DialogModule, InputMaskModule, InputTextModule,
    MessageModule, PanelModule, TagModule,
  ],
  templateUrl: './pagamento.component.html',
  styleUrl: './pagamento.component.scss',
})
export class PagamentoComponent {
  private readonly api = inject(Api);

  /** Dal percorso `/iscrizioni/:id/pagamento`: e' l'id dell'iscrizione. */
  readonly id = input.required<string>();

  protected readonly enrollment = signal<EnrollmentDto | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  // Pagamento con carta (simulato): il pop-up raccoglie i dati, la pagina tiene solo `SavedCard`.
  protected readonly cardDialog = signal(false);
  protected readonly card = signal<SavedCard | null>(null);
  protected readonly paid = signal<string | null>(null);
  protected readonly paying = signal(false);
  protected readonly payError = signal<string | null>(null);
  protected cardNumber = '';
  protected cardHolder = '';
  protected cardExpiry = '';
  protected cardCvv = '';
  protected readonly cardErrors = signal<Record<string, string>>({});

  protected openCardDialog(): void {
    this.cardNumber = '';
    this.cardHolder = '';
    this.cardExpiry = '';
    this.cardCvv = '';
    this.cardErrors.set({});
    this.cardDialog.set(true);
  }

  protected saveCard(): void {
    const errors: Record<string, string> = {};
    const digits = this.cardNumber.replace(/\D/g, '');
    if (digits.length !== 16) errors['number'] = 'Il numero ha 16 cifre.';
    if (!this.cardHolder.trim()) errors['holder'] = "Scrivi l'intestatario.";
    if (!this.validExpiry(this.cardExpiry)) errors['expiry'] = 'Scadenza non valida o passata (MM/AA).';
    if (!/^\d{3}$/.test(this.cardCvv)) errors['cvv'] = 'Il codice ha 3 cifre.';
    this.cardErrors.set(errors);
    if (Object.keys(errors).length > 0) return;
    this.card.set({ last4: digits.slice(-4), holder: this.cardHolder.trim(), expiry: this.cardExpiry });
    this.cardNumber = '';
    this.cardCvv = '';
    this.cardDialog.set(false);
  }

  protected removeCard(): void {
    this.card.set(null);
    this.paid.set(null);
  }

  /** Il backend registra il pagamento (carta simulata): da qui parte solo la fine del numero, mai il numero intero. */
  protected pay(): void {
    const card = this.card();
    if (!card || this.paying()) return;
    this.paying.set(true);
    this.payError.set(null);
    this.api.invoke(paymentPayByCard, { id: this.id(), body: { cardLast4: card.last4 } }).then(
      () => {
        this.paying.set(false);
        this.paid.set(card.last4);
        this.load(this.id());
      },
      (e: ApiError) => {
        this.paying.set(false);
        this.payError.set(e.details.length ? e.details.map((d) => d.message).join(' ') : e.message);
      },
    );
  }

  private validExpiry(value: string): boolean {
    const match = /^(\d{2})\/(\d{2})$/.exec(value);
    if (!match) return false;
    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    const now = new Date();
    return month >= 1 && month <= 12 && (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1));
  }

  constructor() {
    effect(() => this.load(this.id()));
  }

  private load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.invoke(enrollmentGet, { id }).then(
      (response) => {
        this.enrollment.set(response.payload ?? null);
        this.loading.set(false);
      },
      (e: ApiError) => {
        this.error.set(e.status === 404 ? 'Iscrizione non trovata.' : e.message);
        this.loading.set(false);
      },
    );
  }
}
