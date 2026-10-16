import { Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Api } from '../../api/api';
import { eventTypeFindAll } from '../../api/fn/event-types/event-type-find-all';
import { eventCreate } from '../../api/fn/events/event-create';
import { eventGet } from '../../api/fn/events/event-get';
import { eventUpdate } from '../../api/fn/events/event-update';
import { regionFindAll } from '../../api/fn/regions/region-find-all';
import { EventDto, EventRequestDto, EventTypeDto, RegionDto } from '../../api/models';
import { ApiError } from '../../core/api-error';
import { LEVEL_LABELS } from '../../core/labels';
import { SessionService } from '../../core/session.service';

type EventFields = {
  typeCode: string; level: string; region: string; zone: string; title: string; description: string; location: string;
  province: string; startDate: string; endDate: string; registrationOpenDate: string; registrationCloseDate: string;
  seats: number | null; fee: number | null; enrollmentMode: string;
};

const EMPTY: EventFields = {
  typeCode: '', level: '', region: '', zone: '', title: '', description: '', location: '', province: '', startDate: '', endDate: '',
  registrationOpenDate: '', registrationCloseDate: '', seats: null, fee: null, enrollmentMode: '',
};

/** Creazione e modifica di un evento. Requisiti e adempimenti arrivano dal tipo scelto e non si cambiano da qui. */
@Component({
  selector: 'app-event-form',
  imports: [FormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressBarModule, MatSelectModule],
  templateUrl: './event-form.html',
  styleUrl: './event-form.scss',
})
export class EventForm {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly session = inject(SessionService);

  /** Presente solo in modifica (`/segreteria/eventi/:id/modifica`). */
  readonly id = input<string>();

  protected readonly types = signal<EventTypeDto[]>([]);
  protected readonly regions = signal<RegionDto[]>([]);
  protected readonly current = signal<EventDto | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Errori per campo, dalle risposte 422 del backend. */
  protected readonly fieldErrors = signal<Record<string, string>>({});
  protected readonly levels = Object.entries(LEVEL_LABELS);

  protected f: EventFields = { ...EMPTY };

  constructor() {
    this.api.invoke(eventTypeFindAll).then((r) => this.types.set((r.payload ?? []).filter((t) => t.active !== false)), () => undefined);
    this.api.invoke(regionFindAll).then((r) => this.regions.set(r.payload ?? []), () => undefined);
    effect(() => {
      const id = this.id();
      if (id) this.load(id);
      else this.f = { ...EMPTY, level: 'REGIONAL', region: this.session.regionCode() };
    });
  }

  protected editing(): boolean {
    return !!this.id();
  }

  protected canNational(): boolean {
    return this.session.can('tipoevento:gestione');
  }

  protected err(field: string): string {
    return this.fieldErrors()[field] ?? '';
  }

  protected save(): void {
    this.saving.set(true);
    this.error.set(null);
    this.fieldErrors.set({});
    const body = this.body();
    const id = this.id();
    const request = id ? this.api.invoke(eventUpdate, { id, body }) : this.api.invoke(eventCreate, { body });
    request.then(
      () => {
        this.snackBar.open(id ? 'Evento aggiornato.' : 'Bozza creata: ora puoi pubblicarla.', 'Chiudi', { duration: 5000 });
        void this.router.navigate(['/segreteria/eventi']);
      },
      (e: ApiError) => {
        this.saving.set(false);
        const byField: Record<string, string> = {};
        for (const d of e.details) if (d.field) byField[d.field] = d.message;
        this.fieldErrors.set(byField);
        this.error.set(Object.keys(byField).length ? 'Controlla i campi segnati.' : e.message);
      },
    );
  }

  /** I campi vuoti non si inviano; requisiti, adempimenti e referenti restano quelli dell'evento. */
  private body(): EventRequestDto {
    const f = this.f;
    const text = (v: string) => (v.trim() ? v.trim() : undefined);
    const event = this.current();
    return {
      typeCode: f.typeCode,
      level: f.level as EventRequestDto['level'],
      region: (f.region || undefined) as EventRequestDto['region'],
      zone: text(f.zone),
      title: text(f.title),
      description: text(f.description),
      location: text(f.location),
      province: text(f.province.toUpperCase()),
      startDate: f.startDate || undefined,
      endDate: f.endDate || undefined,
      registrationOpenDate: f.registrationOpenDate || undefined,
      registrationCloseDate: f.registrationCloseDate || undefined,
      seats: f.seats ?? undefined,
      fee: f.fee ?? undefined,
      enrollmentMode: (f.enrollmentMode || undefined) as EventRequestDto['enrollmentMode'],
      requirements: event?.requirements,
      obligations: event?.obligations,
      contacts: event?.contacts,
      version: event?.version,
    };
  }

  private load(id: string): void {
    this.loading.set(true);
    this.api.invoke(eventGet, { id }).then(
      (response) => {
        const e = response.payload!;
        this.current.set(e);
        this.f = {
          typeCode: e.typeCode ?? '', level: e.level ?? '', region: e.region ?? '', zone: e.zone ?? '', title: e.title ?? '',
          description: e.description ?? '', location: e.location ?? '', province: e.province ?? '', startDate: e.startDate ?? '',
          endDate: e.endDate ?? '', registrationOpenDate: e.registrationOpenDate ?? '',
          registrationCloseDate: e.registrationCloseDate ?? '', seats: e.seats ?? null, fee: e.fee ?? null,
          enrollmentMode: e.enrollmentMode ?? '',
        };
        this.loading.set(false);
      },
      (e: ApiError) => {
        this.error.set(e.status === 404 ? 'Evento non trovato.' : e.message);
        this.loading.set(false);
      },
    );
  }
}
