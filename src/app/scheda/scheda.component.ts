import { DatePipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { MessageModule } from '@openng/optimus-ui/message';
import { PanelModule } from '@openng/optimus-ui/panel';
import { ProgressBarModule } from '@openng/optimus-ui/progressbar';
import { SelectModule } from '@openng/optimus-ui/select';
import { SelectButtonModule } from '@openng/optimus-ui/selectbutton';
import { TagModule } from '@openng/optimus-ui/tag';
import { TextareaModule } from '@openng/optimus-ui/textarea';
import { Api } from '../api/api';
import { enrollmentGet } from '../api/fn/enrollments/enrollment-get';
import { formGet } from '../api/fn/forms/form-get';
import { formSave } from '../api/fn/forms/form-save';
import { formSubmit } from '../api/fn/forms/form-submit';
import { EnrollmentDto, FormDto } from '../api/models';
import { ApiError } from '../core/api-error';
import { CLOSING_REASON_LABELS, ENROLLMENT_STATUS_LABELS, OBLIGATION_LABELS, OBLIGATION_STATUS_LABELS, label } from '../core/labels';
import { DocumentiIscrizioneComponent } from '../iscrizioni/documenti-iscrizione/documenti-iscrizione.component';

/** La pagina per compilare l'iscrizione: adempimenti, file richiesti (scheda medica…) e scheda elettronica, che si compila a piu' riprese (bozza) e poi si invia. */
@Component({
  selector: 'app-scheda',
  imports: [
    DatePipe, DocumentiIscrizioneComponent, FormsModule, RouterLink, MatButtonModule, MatProgressBarModule, InputTextModule, MessageModule, PanelModule,
    ProgressBarModule, SelectModule, SelectButtonModule, TagModule, TextareaModule,
  ],
  templateUrl: './scheda.component.html',
  styleUrl: './scheda.component.scss',
})
export class SchedaComponent {
  private readonly api = inject(Api);
  private readonly snackBar = inject(MatSnackBar);

  /** Dal percorso `/iscrizioni/:id/scheda`: e' l'id dell'iscrizione. */
  readonly id = input.required<string>();

  protected readonly enrollment = signal<EnrollmentDto | null>(null);
  protected readonly form = signal<FormDto | null>(null);
  protected readonly labelOf = label;
  protected readonly statusLabels = ENROLLMENT_STATUS_LABELS;
  protected readonly obligationLabels = OBLIGATION_LABELS;
  protected readonly obligationStatusLabels = OBLIGATION_STATUS_LABELS;

  /** Icona accanto allo stato di un adempimento: Fatto, In verifica, Da fare (e Rifiutato). */
  protected stateIcon(status?: string): string {
    switch (status) {
      case 'SATISFIED': return 'fa-circle-check';
      case 'IN_REVIEW': return 'fa-hourglass-half';
      case 'REJECTED': return 'fa-circle-xmark';
      default: return 'fa-clock';
    }
  }
  protected readonly closingLabels = CLOSING_REASON_LABELS;
  protected readonly answers = signal<Record<string, string>>({});
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Errori per domanda, dalla chiave `answers.<id>` che manda il backend. */
  protected readonly fieldErrors = signal<Record<string, string>>({});

  constructor() {
    effect(() => this.load(this.id()));
  }

  protected readOnly(): boolean {
    return this.form()?.status === 'SUBMITTED';
  }

  protected readonly yesNo = [{ label: 'Sì', value: 'true' }, { label: 'No', value: 'false' }];

  protected totalQuestions(): number {
    return (this.form()?.sections ?? []).reduce((n, s) => n + (s.questions?.length ?? 0), 0);
  }

  protected answered(): number {
    return Object.values(this.answers()).filter((v) => v.trim() !== '').length;
  }

  protected answeredPercent(): number {
    const total = this.totalQuestions();
    return total ? Math.min(Math.round((this.answered() / total) * 100), 100) : 0;
  }

  protected setAnswer(questionId: string, value: string): void {
    this.answers.update((a) => ({ ...a, [questionId]: value }));
  }

  protected save(): void {
    this.run(() => this.api.invoke(formSave, { id: this.id(), body: { answers: this.answers() } }), 'Bozza salvata.');
  }

  protected submit(): void {
    // Prima si salva quello che c'e' a schermo, poi si invia: cosi' non si perde nulla.
    this.run(async () => {
      await this.api.invoke(formSave, { id: this.id(), body: { answers: this.answers() } });
      return this.api.invoke(formSubmit, { id: this.id() });
    }, 'Scheda inviata.');
  }

  private run(action: () => Promise<{ payload?: FormDto }>, success: string): void {
    this.saving.set(true);
    this.error.set(null);
    this.fieldErrors.set({});
    action().then(
      (response) => {
        this.apply(response.payload ?? null);
        this.saving.set(false);
        this.snackBar.open(success, 'Chiudi', { duration: 4000 });
      },
      (e: ApiError) => {
        this.saving.set(false);
        const byQuestion: Record<string, string> = {};
        for (const d of e.details) {
          if (d.field?.startsWith('answers.')) byQuestion[d.field.slice('answers.'.length)] = d.message;
        }
        this.fieldErrors.set(byQuestion);
        this.error.set(Object.keys(byQuestion).length ? 'Controlla le risposte segnate.' : e.message);
      },
    );
  }

  protected hasDocuments(): boolean {
    return !!this.enrollment()?.active && (this.enrollment()?.obligations ?? []).some((o) => o.type === 'DOCUMENT' && o.status !== 'NOT_REQUIRED' && o.code);
  }

  protected hasForm(): boolean {
    return (this.enrollment()?.obligations ?? []).some((o) => o.type === 'ELECTRONIC_FORM' && o.status !== 'NOT_REQUIRED');
  }

  /** Dopo un caricamento il backend ha cambiato gli adempimenti: si rilegge l'iscrizione. */
  protected reloadEnrollment(): void {
    this.api.invoke(enrollmentGet, { id: this.id() }).then(
      (response) => this.enrollment.set(response.payload ?? null),
      () => undefined,
    );
  }

  private load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.invoke(enrollmentGet, { id }).then(
      (response) => {
        const enrollment = response.payload ?? null;
        this.enrollment.set(enrollment);
        if (this.hasForm()) {
          this.loadForm(id);
        } else {
          this.loading.set(false);
        }
      },
      (e: ApiError) => {
        this.error.set(e.status === 404 ? 'Iscrizione non trovata.' : e.message);
        this.loading.set(false);
      },
    );
  }

  private loadForm(id: string): void {
    this.api.invoke(formGet, { id }).then(
      (response) => {
        this.apply(response.payload ?? null);
        this.loading.set(false);
      },
      (e: ApiError) => {
        this.error.set(e.message);
        this.loading.set(false);
      },
    );
  }

  private apply(form: FormDto | null): void {
    this.form.set(form);
    this.answers.set({ ...(form?.answers ?? {}) });
  }
}
