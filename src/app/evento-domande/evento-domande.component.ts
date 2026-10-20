import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { CheckboxModule } from '@openng/optimus-ui/checkbox';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { SelectModule } from '@openng/optimus-ui/select';
import { TextareaModule } from '@openng/optimus-ui/textarea';
import { FormQuestionDto, FormSectionDto } from '../api/models';
import { QUESTION_TYPE_LABELS } from '../core/labels';

/** Editor delle domande della scheda di un evento: sezioni con domande, che la segreteria scrive e il partecipante compila. */
@Component({
  selector: 'app-evento-domande',
  imports: [FormsModule, MatButtonModule, CheckboxModule, InputTextModule, SelectModule, TextareaModule],
  templateUrl: './evento-domande.component.html',
  styleUrl: './evento-domande.component.scss',
})
export class EventoDomandeComponent {
  readonly sections = model<FormSectionDto[]>([]);
  /** Dopo la pubblicazione le domande non si cambiano. */
  readonly locked = input(false);

  protected readonly typeOptions = Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => ({ value, label }));

  protected addSection(): void {
    this.sections.update((s) => [...s, { title: '', questions: [{ id: '', text: '', type: 'TEXT', required: false, sensitive: false }] }]);
  }

  protected removeSection(index: number): void {
    this.sections.update((s) => s.filter((_, i) => i !== index));
  }

  protected addQuestion(section: FormSectionDto): void {
    section.questions = [...(section.questions ?? []), { id: '', text: '', type: 'TEXT', required: false, sensitive: false }];
    this.sections.update((s) => [...s]);
  }

  protected removeQuestion(section: FormSectionDto, index: number): void {
    section.questions = (section.questions ?? []).filter((_, i) => i !== index);
    this.sections.update((s) => [...s]);
  }

  /** Le opzioni di una domanda a scelta si scrivono una per riga. */
  protected optionsText(q: FormQuestionDto): string {
    return (q.options ?? []).join('\n');
  }

  protected setOptions(q: FormQuestionDto, text: string): void {
    q.options = text.split('\n').map((o) => o.trim()).filter(Boolean);
  }
}
