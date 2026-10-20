import { Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CheckboxModule } from '@openng/optimus-ui/checkbox';
import { DatePickerModule } from '@openng/optimus-ui/datepicker';
import { FluidModule } from '@openng/optimus-ui/fluid';
import { InputNumberModule } from '@openng/optimus-ui/inputnumber';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { MessageModule } from '@openng/optimus-ui/message';
import { PanelModule } from '@openng/optimus-ui/panel';
import { SelectModule } from '@openng/optimus-ui/select';
import { TextareaModule } from '@openng/optimus-ui/textarea';
import { Api } from '../api/api';
import { formTemplateGet } from '../api/fn/forms/form-template-get';
import { eventTypeFindAll } from '../api/fn/event-types/event-type-find-all';
import { eventCreate } from '../api/fn/events/event-create';
import { eventGet } from '../api/fn/events/event-get';
import { eventUpdate } from '../api/fn/events/event-update';
import { regionFindAll } from '../api/fn/regions/region-find-all';
import { EventDto, EventRequestDto, EventTypeDto, FormSectionDto, RegionDto } from '../api/models';
import { EventoDomandeComponent } from '../evento-domande/evento-domande.component';
import { ApiError } from '../core/api-error';
import { dateToIso, isoToDate } from '../core/data-italiana';
import { LEVEL_LABELS } from '../core/labels';
import { SessionService } from '../core/session.service';

type EventFields = {
  typeCode: string; level: string; region: string; zone: string; title: string; description: string; location: string;
  province: string; startDate: string; endDate: string; registrationOpenDate: string; registrationCloseDate: string;
  seats: number | null; fee: number | null; enrollmentMode: string; medicalFormRequired: boolean; dietaryInfoRequired: boolean;
};

type DateField = 'startDate' | 'endDate' | 'registrationOpenDate' | 'registrationCloseDate';

const EMPTY: EventFields = {
  typeCode: '', level: '', region: '', zone: '', title: '', description: '', location: '', province: '', startDate: '', endDate: '',
  registrationOpenDate: '', registrationCloseDate: '', seats: null, fee: null, enrollmentMode: '',
  medicalFormRequired: false, dietaryInfoRequired: false,
};

/** Creazione e modifica di un evento, in pannelli (categoria e regione, informazioni, date, posti e quota, capo) con i componenti Optimus. Requisiti e adempimenti arrivano dal tipo scelto e non si cambiano da qui. */
@Component({
  selector: 'app-evento-form',
  imports: [
    FormsModule, RouterLink, MatButtonModule, MatProgressBarModule,
    CheckboxModule, DatePickerModule, EventoDomandeComponent, FluidModule, InputNumberModule, InputTextModule, MessageModule, PanelModule, SelectModule, TextareaModule,
  ],
  templateUrl: './evento-form.component.html',
  styleUrl: './evento-form.component.scss',
})
export class EventoFormComponent {
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
  protected readonly modeOptions = [
    { value: 'SELF', label: 'Il socio da solo' },
    { value: 'BY_LEADER', label: 'Il capo unità' },
    { value: 'BOTH', label: 'Entrambi' },
  ];
  protected readonly dateFields: { key: DateField; id: string; label: string }[] = [
    { key: 'startDate', id: 'f-start', label: 'Inizio' },
    { key: 'endDate', id: 'f-end', label: 'Fine' },
  ];
  protected readonly registrationFields: { key: DateField; id: string; label: string }[] = [
    { key: 'registrationOpenDate', id: 'f-open', label: 'Apertura iscrizioni' },
    { key: 'registrationCloseDate', id: 'f-close', label: 'Chiusura iscrizioni' },
  ];

  protected f: EventFields = { ...EMPTY };
  /** Le domande della scheda, facoltative: se non ce n'e' nessuna l'evento non ha scheda. */
  protected readonly formSections = signal<FormSectionDto[]>([]);
  protected readonly templateMessage = signal<string | null>(null);

  /** Il calendario lavora con date, il modulo e il backend con "aaaa-mm-gg": `dates` e `f` si tengono allineati. */
  protected dates: Record<DateField, Date | null> = { startDate: null, endDate: null, registrationOpenDate: null, registrationCloseDate: null };

  protected setDate(field: DateField, date: Date | null): void {
    this.dates[field] = date;
    this.f[field] = dateToIso(date);
  }

  private syncDates(): void {
    for (const key of ['startDate', 'endDate', 'registrationOpenDate', 'registrationCloseDate'] as const) this.dates[key] = isoToDate(this.f[key]);
  }

  /** Il livello nazionale lo vede solo chi puo' gestire i tipi di evento. */
  protected levelOptions(): { value: string; label: string }[] {
    return Object.entries(LEVEL_LABELS)
      .filter(([value]) => value !== 'NATIONAL' || this.canNational())
      .map(([value, label]) => ({ value, label }));
  }

  constructor() {
    this.api.invoke(eventTypeFindAll).then((r) => this.types.set((r.payload ?? []).filter((t) => t.active !== false)), () => undefined);
    this.api.invoke(regionFindAll).then((r) => this.regions.set(r.payload ?? []), () => undefined);
    effect(() => {
      const id = this.id();
      if (id) this.load(id);
      else {
        this.f = { ...EMPTY, level: 'REGIONAL', region: this.session.regionCode() };
        this.formSections.set([]);
        this.syncDates();
      }
    });
  }

  protected editing(): boolean {
    return !!this.id();
  }

  /** Dopo la pubblicazione le domande e le richieste di scheda medica e intolleranze non si cambiano. */
  protected locked(): boolean {
    const status = this.current()?.status;
    return !!status && status !== 'DRAFT';
  }

  /** Parte dalle domande del modello del tipo scelto, se l'amministrazione ne ha scritto uno. */
  protected useTypeTemplate(): void {
    this.templateMessage.set(null);
    this.api.invoke(formTemplateGet, { code: this.f.typeCode }).then(
      (r) => this.formSections.set(structuredClone(r.payload?.sections ?? [])),
      () => this.templateMessage.set('Questo tipo non ha un modello di domande.'),
    );
  }

  /** Domande senza testo si scartano; quelle nuove ricevono un identificativo (`d1`, `d2`...), le altre tengono il proprio. */
  private cleanSections(): FormSectionDto[] | undefined {
    const sections = this.formSections()
      .map((s) => ({ ...s, title: s.title?.trim() || 'Domande', questions: (s.questions ?? []).filter((q) => q.text?.trim()) }))
      .filter((s) => s.questions.length > 0);
    if (sections.length === 0) return undefined;
    const taken = new Set(sections.flatMap((s) => s.questions.map((q) => q.id).filter(Boolean)));
    let counter = 1;
    return sections.map((s) => ({
      ...s,
      questions: s.questions.map((q) => {
        if (q.id) return { ...q, text: q.text!.trim() };
        while (taken.has(`d${counter}`)) counter++;
        taken.add(`d${counter}`);
        return { ...q, id: `d${counter}`, text: q.text!.trim() };
      }),
    }));
  }

  protected canNational(): boolean {
    return this.session.can('tipoevento:gestione');
  }

  /** Avvisi sulle date mentre si scrive: stesse regole che il backend applica alla pubblicazione, la bozza si salva comunque. */
  protected dateWarnings(): string[] {
    const { startDate: start, endDate: end } = this.f;
    return start && end && end < start ? ['Il rientro non può precedere la partenza.'] : [];
  }

  protected registrationWarnings(): string[] {
    const { startDate: start, registrationOpenDate: open, registrationCloseDate: close } = this.f;
    const warnings: string[] = [];
    if (open && close && open >= close) warnings.push('La chiusura delle iscrizioni deve seguire l’apertura.');
    else if (close && start && close > start) warnings.push('Le iscrizioni devono chiudere entro la partenza.');
    return warnings;
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
      formSections: this.cleanSections(),
      medicalFormRequired: f.medicalFormRequired,
      dietaryInfoRequired: f.dietaryInfoRequired,
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
          enrollmentMode: e.enrollmentMode ?? '', medicalFormRequired: !!e.medicalFormRequired, dietaryInfoRequired: !!e.dietaryInfoRequired,
        };
        this.formSections.set(structuredClone(e.formSections ?? []));
        this.syncDates();
        this.loading.set(false);
      },
      (e: ApiError) => {
        this.error.set(e.status === 404 ? 'Evento non trovato.' : e.message);
        this.loading.set(false);
      },
    );
  }
}
