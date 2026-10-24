import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MessageModule } from '@openng/optimus-ui/message';
import { PanelModule } from '@openng/optimus-ui/panel';
import { TagModule } from '@openng/optimus-ui/tag';
import { Api } from '../api/api';
import { enrollmentGet } from '../api/fn/enrollments/enrollment-get';
import { EnrollmentDto } from '../api/models';
import { ApiError } from '../core/api-error';

/** La pagina del pagamento di un'iscrizione: quota, versato, residuo e coordinate del bonifico. */
@Component({
  selector: 'app-pagamento',
  imports: [CurrencyPipe, DatePipe, RouterLink, MatButtonModule, MatProgressBarModule, MessageModule, PanelModule, TagModule],
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
