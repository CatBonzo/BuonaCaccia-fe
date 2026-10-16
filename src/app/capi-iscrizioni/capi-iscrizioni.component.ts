import { DatePipe } from '@angular/common';
import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Api } from '../api/api';
import { enrollmentApprove } from '../api/fn/enrollments/enrollment-approve';
import { enrollmentPresented } from '../api/fn/enrollments/enrollment-presented';
import { enrollmentReject } from '../api/fn/enrollments/enrollment-reject';
import { enrollmentToAuthorize } from '../api/fn/enrollments/enrollment-to-authorize';
import { enrollmentWithdraw } from '../api/fn/enrollments/enrollment-withdraw';
import { EnrollmentDto } from '../api/models';
import { ApiError } from '../core/api-error';
import { ENROLLMENT_STATUS_LABELS, LEADER_ACTIONS, OBLIGATION_LABELS, OBLIGATION_STATUS_LABELS, label } from '../core/labels';

const PAGE_SIZE = 10;

/** Le due liste dei capi: iscrizioni da autorizzare (`toAuthorize`) e ragazzi che ho iscritto io (`presented`). */
@Component({
  selector: 'app-capi-iscrizioni',
  imports: [
    DatePipe, FormsModule, RouterLink, MatButtonModule, MatCardModule, MatChipsModule, MatFormFieldModule, MatInputModule,
    MatPaginatorModule, MatProgressBarModule,
  ],
  templateUrl: './capi-iscrizioni.component.html',
  styleUrl: './capi-iscrizioni.component.scss',
})
export class CapiIscrizioniComponent {
  private readonly api = inject(Api);
  private readonly snackBar = inject(MatSnackBar);

  /** Arriva dai dati della rotta. */
  readonly mode = input.required<'toAuthorize' | 'presented'>();

  protected readonly enrollments = signal<EnrollmentDto[]>([]);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly rejecting = signal<string | null>(null);
  protected readonly confirming = signal<string | null>(null);
  protected reason = '';
  protected readonly pageSize = PAGE_SIZE;
  protected readonly labelOf = label;
  protected readonly statusLabels = ENROLLMENT_STATUS_LABELS;
  protected readonly obligationLabels = OBLIGATION_LABELS;
  protected readonly obligationStatusLabels = OBLIGATION_STATUS_LABELS;

  constructor() {
    effect(() => {
      this.mode();
      untracked(() => this.load(0));
    });
  }

  protected onPage(event: PageEvent): void {
    this.load(event.pageIndex);
  }

  /** Le azioni da capo che il backend offre su questa iscrizione, con il tipo di adempimento. */
  protected leaderActions(e: EnrollmentDto, approve: boolean) {
    return (e.availableActions ?? [])
      .map((a) => ({ action: a, ...LEADER_ACTIONS[a] }))
      .filter((a) => a.type && a.approve === approve);
  }

  protected canWithdraw(e: EnrollmentDto): boolean {
    return e.availableActions?.includes('WITHDRAW') ?? false;
  }

  protected approve(e: EnrollmentDto, type: 'UNIT_LEADER_AUTHORIZATION' | 'GROUP_LEADER_AUTHORIZATION'): void {
    this.act(this.api.invoke(enrollmentApprove, { id: e.id!, type }), 'Autorizzazione data.');
  }

  protected startReject(e: EnrollmentDto): void {
    this.rejecting.set(e.id!);
    this.reason = '';
  }

  protected reject(e: EnrollmentDto, type: 'UNIT_LEADER_AUTHORIZATION' | 'GROUP_LEADER_AUTHORIZATION'): void {
    if (!this.reason.trim()) {
      this.error.set('Scrivi il motivo: lo vedono il ragazzo e la segreteria.');
      return;
    }
    this.act(this.api.invoke(enrollmentReject, { id: e.id!, type, body: { reason: this.reason.trim() } }), 'Autorizzazione negata.');
  }

  protected withdraw(e: EnrollmentDto): void {
    this.act(this.api.invoke(enrollmentWithdraw, { id: e.id! }), 'Iscrizione ritirata.');
  }

  private act(request: Promise<unknown>, success: string): void {
    this.error.set(null);
    request.then(
      () => {
        this.rejecting.set(null);
        this.confirming.set(null);
        this.snackBar.open(success, 'Chiudi', { duration: 4000 });
        this.load(this.pageIndex());
      },
      (e: ApiError) => this.error.set(e.message),
    );
  }

  private load(page: number): void {
    this.loading.set(true);
    const call =
      this.mode() === 'toAuthorize'
        ? this.api.invoke(enrollmentToAuthorize, { page, size: PAGE_SIZE })
        : this.api.invoke(enrollmentPresented, { page, size: PAGE_SIZE });
    call.then(
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
