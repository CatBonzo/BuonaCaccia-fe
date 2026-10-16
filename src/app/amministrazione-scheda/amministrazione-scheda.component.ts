import { Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Api } from '../api/api';
import { formTemplateGet } from '../api/fn/forms/form-template-get';
import { formTemplateSave } from '../api/fn/forms/form-template-save';
import { FormQuestionDto, FormSectionDto } from '../api/models';
import { ApiError, ApiErrorDetail } from '../core/api-error';
import { QUESTION_TYPE_LABELS } from '../core/labels';

/** Il modello di scheda di un tipo di evento: sezioni e domande che il partecipante compila. */
@Component({
  selector: 'app-amministrazione-scheda',
  imports: [FormsModule, RouterLink, MatButtonModule, MatCardModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './amministrazione-scheda.component.html',
  styleUrl: './amministrazione-scheda.component.scss',
})
export class AmministrazioneSchedaComponent {
  private readonly api = inject(Api);
  private readonly snackBar = inject(MatSnackBar);

  /** Arriva dal percorso `/amministrazione/tipi-evento/:code/scheda`. */
  readonly code = input.required<string>();

  protected readonly sections = signal<FormSectionDto[]>([]);
  protected readonly error = signal<{ message: string; details: ApiErrorDetail[] } | null>(null);
  protected readonly questionTypes = Object.entries(QUESTION_TYPE_LABELS);

  constructor() {
    effect(() => {
      this.api.invoke(formTemplateGet, { code: this.code() }).then(
        (r) => this.sections.set(structuredClone(r.payload?.sections ?? [])),
        (e: ApiError) => this.error.set({ message: e.message, details: [] }),
      );
    });
  }

  protected addSection(): void {
    this.sections.update((s) => [...s, { title: '', questions: [] }]);
  }

  protected removeSection(index: number): void {
    this.sections.update((s) => s.filter((_, i) => i !== index));
  }

  protected addQuestion(section: FormSectionDto): void {
    section.questions = [...(section.questions ?? []), { id: '', text: '', type: 'TEXT', required: false, sensitive: false }];
  }

  protected removeQuestion(section: FormSectionDto, index: number): void {
    section.questions = (section.questions ?? []).filter((_, i) => i !== index);
  }

  /** Le opzioni di una domanda a scelta si scrivono una per riga. */
  protected optionsText(q: FormQuestionDto): string {
    return (q.options ?? []).join('\n');
  }

  protected setOptions(q: FormQuestionDto, text: string): void {
    q.options = text.split('\n').map((o) => o.trim()).filter(Boolean);
  }

  protected save(): void {
    this.error.set(null);
    const taken = new Set(this.sections().flatMap((s) => (s.questions ?? []).map((q) => q.id).filter(Boolean)));
    let counter = 1;
    const sections = this.sections().map((s) => ({
      ...s,
      questions: (s.questions ?? []).map((q) => {
        if (q.id) return q;
        while (taken.has(`d${counter}`)) counter++;
        taken.add(`d${counter}`);
        return { ...q, id: `d${counter}` };
      }),
    }));
    this.api.invoke(formTemplateSave, { code: this.code(), body: { sections } }).then(
      (r) => {
        this.sections.set(structuredClone(r.payload?.sections ?? []));
        this.snackBar.open('Scheda salvata.', 'Chiudi', { duration: 4000 });
      },
      (e: ApiError) => this.error.set({ message: e.message, details: e.details }),
    );
  }
}
