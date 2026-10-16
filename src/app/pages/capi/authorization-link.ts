import { DatePipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Api } from '../../api/api';
import { authorizationLinkApprove } from '../../api/fn/authorization-links/authorization-link-approve';
import { authorizationLinkRead } from '../../api/fn/authorization-links/authorization-link-read';
import { authorizationLinkReject } from '../../api/fn/authorization-links/authorization-link-reject';
import { AuthorizationLinkDto, LinkOutcomeDto } from '../../api/models';
import { ApiError } from '../../core/api-error';
import { OBLIGATION_LABELS, label } from '../../core/labels';

/** La pagina del link ricevuto per e-mail: il capo autorizza o nega senza accedere. */
@Component({
  selector: 'app-authorization-link',
  imports: [DatePipe, FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule],
  templateUrl: './authorization-link.html',
  styleUrl: './authorization-link.scss',
})
export class AuthorizationLink {
  private readonly api = inject(Api);

  /** Arriva dal percorso `/autorizza/:token`. */
  readonly token = input.required<string>();

  protected readonly link = signal<AuthorizationLinkDto | null>(null);
  protected readonly outcome = signal<LinkOutcomeDto | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly rejecting = signal(false);
  protected reason = '';
  protected readonly labelOf = label;
  protected readonly obligationLabels = OBLIGATION_LABELS;

  constructor() {
    effect(() => {
      this.api.invoke(authorizationLinkRead, { token: this.token() }).then(
        (r) => {
          this.link.set(r.payload ?? null);
          this.loading.set(false);
        },
        (e: ApiError) => {
          this.error.set(e.message);
          this.loading.set(false);
        },
      );
    });
  }

  protected approve(): void {
    this.error.set(null);
    this.api.invoke(authorizationLinkApprove, { token: this.token() }).then(
      (r) => this.outcome.set(r.payload ?? {}),
      (e: ApiError) => this.error.set(e.message),
    );
  }

  protected reject(): void {
    if (!this.reason.trim()) {
      this.error.set('Scrivi il motivo del rifiuto.');
      return;
    }
    this.error.set(null);
    this.api.invoke(authorizationLinkReject, { token: this.token(), body: { reason: this.reason.trim() } }).then(
      (r) => this.outcome.set(r.payload ?? {}),
      (e: ApiError) => this.error.set(e.message),
    );
  }
}
