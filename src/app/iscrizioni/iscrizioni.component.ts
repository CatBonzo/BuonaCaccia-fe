import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Api } from '../api/api';
import { DocumentiIscrizioneComponent } from './documenti-iscrizione/documenti-iscrizione.component';
import { enrollmentMine } from '../api/fn/enrollments/enrollment-mine';
import { enrollmentWithdraw } from '../api/fn/enrollments/enrollment-withdraw';
import { EnrollmentDto } from '../api/models';
import { ApiError } from '../core/api-error';
import {
  CLOSING_REASON_LABELS, ENROLLMENT_STATUS_LABELS, OBLIGATION_LABELS, OBLIGATION_STATUS_LABELS, label,
} from '../core/labels';

const PAGE_SIZE = 10;

/** Le iscrizioni del socio: stato, posizione, scadenza, cosa manca e ritiro. */
@Component({
  selector: 'app-iscrizioni',
  imports: [CurrencyPipe, DatePipe, RouterLink, DocumentiIscrizioneComponent, MatButtonModule, MatCardModule, MatChipsModule, MatPaginatorModule, MatProgressBarModule],
  templateUrl: './iscrizioni.component.html',
  styleUrl: './iscrizioni.component.scss',
})
export class IscrizioniComponent {
  private readonly api = inject(Api);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly enrollments = signal<EnrollmentDto[]>([]);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  /** L'iscrizione per cui si sta chiedendo conferma del ritiro. */
  protected readonly confirming = signal<string | null>(null);
  protected readonly pageSize = PAGE_SIZE;

  protected readonly labelOf = label;
  protected readonly statusLabels = ENROLLMENT_STATUS_LABELS;
  protected readonly obligationLabels = OBLIGATION_LABELS;
  protected readonly obligationStatusLabels = OBLIGATION_STATUS_LABELS;
  protected readonly closingLabels = CLOSING_REASON_LABELS;

  constructor() {
    this.load(0);
  }

  protected onPage(event: PageEvent): void {
    this.load(event.pageIndex);
  }

  protected hasDocuments(enrollment: EnrollmentDto): boolean {
    return !!enrollment.active && (enrollment.obligations ?? []).some((o) => o.type === 'DOCUMENT' && o.status !== 'NOT_REQUIRED' && o.code);
  }

  protected hasForm(enrollment: EnrollmentDto): boolean {
    return !!enrollment.active && (enrollment.obligations ?? []).some((o) => o.type === 'ELECTRONIC_FORM' && o.status !== 'NOT_REQUIRED');
  }

  protected reload(): void {
    this.load(this.pageIndex());
  }

  protected canWithdraw(enrollment: EnrollmentDto): boolean {
    return enrollment.availableActions?.includes('WITHDRAW') ?? false;
  }

  protected withdraw(enrollment: EnrollmentDto): void {
    this.api.invoke(enrollmentWithdraw, { id: enrollment.id! }).then(
      () => {
        this.confirming.set(null);
        this.snackBar.open('Iscrizione ritirata.', 'Chiudi', { duration: 5000 });
        this.load(this.pageIndex());
      },
      (e: ApiError) => {
        this.confirming.set(null);
        this.error.set(e.message);
      },
    );
  }

  private load(page: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.invoke(enrollmentMine, { page, size: PAGE_SIZE }).then(
      (response) => {
        const result = response.payload;
        this.enrollments.set(result?.content ?? []);
        this.total.set(result?.totalElements ?? 0);
        this.pageIndex.set(result?.page ?? page);
        this.loading.set(false);
      },
      (e: ApiError) => {
        this.error.set(e.message);
        this.loading.set(false);
      },
    );
  }
}
