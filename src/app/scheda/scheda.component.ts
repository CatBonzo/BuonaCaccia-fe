import { DatePipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Api } from '../api/api';
import { formGet } from '../api/fn/forms/form-get';
import { formSave } from '../api/fn/forms/form-save';
import { formSubmit } from '../api/fn/forms/form-submit';
import { FormDto } from '../api/models';
import { ApiError } from '../core/api-error';

/** La scheda elettronica di un'iscrizione: si compila a piu' riprese (bozza) e poi si invia. */
@Component({
  selector: 'app-scheda',
  imports: [
    DatePipe, FormsModule, RouterLink, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatProgressBarModule, MatRadioModule, MatSelectModule,
  ],
  templateUrl: './scheda.component.html',
  styleUrl: './scheda.component.scss',
})
export class SchedaComponent {
  private readonly api = inject(Api);
  private readonly snackBar = inject(MatSnackBar);

  /** Dal percorso `/iscrizioni/:id/scheda`: e' l'id dell'iscrizione. */
  readonly id = input.required<string>();

  protected readonly form = signal<FormDto | null>(null);
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

  private load(id: string): void {
    this.loading.set(true);
    this.api.invoke(formGet, { id }).then(
      (response) => {
        this.apply(response.payload ?? null);
        this.loading.set(false);
      },
      (e: ApiError) => {
        this.error.set(e.status === 404 ? 'Questa iscrizione non ha una scheda da compilare.' : e.message);
        this.loading.set(false);
      },
    );
  }

  private apply(form: FormDto | null): void {
    this.form.set(form);
    this.answers.set({ ...(form?.answers ?? {}) });
  }
}
