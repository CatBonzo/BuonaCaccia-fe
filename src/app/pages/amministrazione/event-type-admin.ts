import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Api } from '../../api/api';
import { eventTypeCreate } from '../../api/fn/event-types/event-type-create';
import { eventTypeDeactivate } from '../../api/fn/event-types/event-type-deactivate';
import { eventTypeFindAll } from '../../api/fn/event-types/event-type-find-all';
import { eventTypeUpdate } from '../../api/fn/event-types/event-type-update';
import { EventTypeDto, ObligationDto, RequirementsDto } from '../../api/models';
import { ApiError, ApiErrorDetail } from '../../core/api-error';
import { BRANCH_LABELS, CATEGORY_LABELS, DELIVERY_LABELS, MEMBER_TYPE_LABELS, OBLIGATION_LABELS, label } from '../../core/labels';

/** Tipi di evento: elenco con quelli disattivati, creazione, modifica di requisiti e adempimenti predefiniti, disattivazione. */
@Component({
  selector: 'app-event-type-admin',
  imports: [
    FormsModule, RouterLink, MatButtonModule, MatCardModule, MatCheckboxModule, MatChipsModule, MatFormFieldModule, MatInputModule,
    MatProgressBarModule, MatSelectModule,
  ],
  templateUrl: './event-type-admin.html',
  styleUrl: './event-type-admin.scss',
})
export class EventTypeAdmin {
  private readonly api = inject(Api);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly types = signal<EventTypeDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<{ message: string; details: ApiErrorDetail[] } | null>(null);
  /** Il tipo in lavorazione: `null` = nessuno, `isNew` = creazione. */
  protected readonly editing = signal<EventTypeDto | null>(null);
  protected isNew = false;
  protected readonly confirming = signal<string | null>(null);

  protected readonly labelOf = label;
  protected readonly categories = Object.entries(CATEGORY_LABELS);
  protected readonly branches = Object.entries(BRANCH_LABELS);
  protected readonly memberTypes = Object.entries(MEMBER_TYPE_LABELS);
  protected readonly obligationTypes = Object.entries(OBLIGATION_LABELS);
  protected readonly deliveries = Object.entries(DELIVERY_LABELS);
  protected readonly categoryLabels = CATEGORY_LABELS;
  protected readonly obligationLabels = OBLIGATION_LABELS;

  constructor() {
    this.load();
  }

  protected startNew(): void {
    this.isNew = true;
    this.error.set(null);
    this.editing.set({ code: '', name: '', category: 'EG', application: false, active: true, defaultRequirements: {}, defaultObligations: [] });
  }

  protected startEdit(type: EventTypeDto): void {
    this.isNew = false;
    this.error.set(null);
    this.editing.set(structuredClone({ ...type, defaultRequirements: type.defaultRequirements ?? {}, defaultObligations: type.defaultObligations ?? [] }));
  }

  protected req(): RequirementsDto {
    return this.editing()!.defaultRequirements!;
  }

  protected addObligation(): void {
    this.editing()!.defaultObligations!.push({ type: 'UNIT_LEADER_AUTHORIZATION' });
  }

  protected removeObligation(index: number): void {
    this.editing()!.defaultObligations!.splice(index, 1);
  }

  protected isDocument(o: ObligationDto): boolean {
    return o.type === 'DOCUMENT';
  }

  protected save(): void {
    const type = this.editing()!;
    this.error.set(null);
    const request = this.isNew
      ? this.api.invoke(eventTypeCreate, { body: type })
      : this.api.invoke(eventTypeUpdate, { code: type.code, body: type });
    request.then(
      () => {
        this.snackBar.open(this.isNew ? 'Tipo creato.' : 'Tipo aggiornato.', 'Chiudi', { duration: 4000 });
        this.editing.set(null);
        this.load();
      },
      (e: ApiError) => this.error.set({ message: e.message, details: e.details }),
    );
  }

  protected deactivate(type: EventTypeDto): void {
    this.api.invoke(eventTypeDeactivate, { code: type.code }).then(
      () => {
        this.confirming.set(null);
        this.snackBar.open('Tipo disattivato: non si possono creare nuovi eventi di questo tipo.', 'Chiudi', { duration: 5000 });
        this.load();
      },
      (e: ApiError) => this.error.set({ message: e.message, details: e.details }),
    );
  }

  private load(): void {
    this.loading.set(true);
    this.api.invoke(eventTypeFindAll, { includeInactive: true }).then(
      (r) => {
        this.types.set(r.payload ?? []);
        this.loading.set(false);
      },
      (e: ApiError) => {
        this.error.set({ message: e.message, details: [] });
        this.loading.set(false);
      },
    );
  }
}
