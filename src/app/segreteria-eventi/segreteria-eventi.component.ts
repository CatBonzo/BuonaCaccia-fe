import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Api } from '../api/api';
import { eventCreate } from '../api/fn/events/event-create';
import { eventCancel } from '../api/fn/events/event-cancel';
import { eventDelete } from '../api/fn/events/event-delete';
import { eventCloseRegistrations } from '../api/fn/events/event-close-registrations';
import { eventManaged, EventManaged$Params } from '../api/fn/events/event-managed';
import { eventPublish } from '../api/fn/events/event-publish';
import { EventDto, EventRequestDto } from '../api/models';
import { ApiError } from '../core/api-error';
import { STATUS_LABELS, label } from '../core/labels';
import { SessionService } from '../core/session.service';
import { EventoConfermaComponent } from '../evento-conferma/evento-conferma.component';

const PAGE_SIZE = 12;

/** Gli eventi della propria regione, in qualunque stato, in una tabella: si vede, si modifica, si elimina; le altre azioni stanno nel menu della riga. */
@Component({
  selector: 'app-segreteria-eventi',
  imports: [
    DatePipe, FormsModule, RouterLink, MatButtonModule, MatCheckboxModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatMenuModule, MatPaginatorModule, MatProgressBarModule, MatSelectModule, MatTableModule, MatTooltipModule,
  ],
  templateUrl: './segreteria-eventi.component.html',
  styleUrl: './segreteria-eventi.component.scss',
})
export class SegreteriaEventiComponent {
  private readonly api = inject(Api);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  protected readonly session = inject(SessionService);

  protected readonly events = signal<EventDto[]>([]);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly statuses = Object.entries(STATUS_LABELS);
  protected readonly labelOf = label;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly pageSize = PAGE_SIZE;
  protected status = '';
  protected q = '';
  protected sort = 'createdAt,desc';

  /** Il filtro sull'ID (il codice dell'evento) si applica alle righe che si vedono: il backend cerca solo nel titolo. */
  protected readonly idFilter = signal('');
  private nameTimer: ReturnType<typeof setTimeout> | undefined;

  /** Le righe scelte con le caselle (per id): servono alla barra delle azioni in basso. */
  private readonly selectedIds = signal<ReadonlySet<string>>(new Set());
  /** Le righe in tabella: quelle arrivate dal backend, ristrette dal filtro sull'ID. */
  protected readonly rows = computed(() => {
    const id = this.idFilter().trim().toLowerCase();
    return id ? this.events().filter((e) => e.code?.toLowerCase().includes(id)) : this.events();
  });
  protected readonly selected = computed(() => this.rows().filter((e) => this.selectedIds().has(e.id!)));
  protected readonly allSelected = computed(() => this.rows().length > 0 && this.selected().length === this.rows().length);
  protected readonly someSelected = computed(() => this.selected().length > 0 && !this.allSelected());

  /** Le righe si riconoscono per id: quando l'elenco si ricarica (filtri) quelle che restano non si ridisegnano. */
  protected readonly trackById = (_: number, e: EventDto) => e.id;
  protected readonly columns = ['seleziona', 'id', 'nome', 'stato', 'azioni'];
  protected readonly filterColumns = ['f-seleziona', 'f-id', 'f-nome', 'f-stato', 'f-azioni'];

  constructor() {
    this.load(0);
  }

  protected filter(): void {
    this.load(0);
  }

  /** Il nome si cerca sul backend mentre si scrive, dopo una breve pausa per non fare una richiesta a ogni lettera. */
  protected onName(value: string): void {
    this.q = value;
    clearTimeout(this.nameTimer);
    this.nameTimer = setTimeout(() => this.load(0), 300);
  }

  protected resetFilters(): void {
    this.q = '';
    this.status = '';
    this.idFilter.set('');
    this.load(0);
  }

  protected onPage(event: PageEvent): void {
    this.load(event.pageIndex);
  }

  protected isSelected(e: EventDto): boolean {
    return this.selectedIds().has(e.id!);
  }

  protected toggle(e: EventDto): void {
    const next = new Set(this.selectedIds());
    if (!next.delete(e.id!)) next.add(e.id!);
    this.selectedIds.set(next);
  }

  protected toggleAll(): void {
    this.selectedIds.set(this.allSelected() ? new Set() : new Set(this.rows().map((e) => e.id!)));
  }

  protected clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  /** Scarica le righe scelte in un file CSV (separatore `;` e segno di codifica, cosi' Excel in italiano lo apre bene). */
  protected exportSelected(): void {
    const cell = (v: unknown) => `"${String(v ?? '').replaceAll('"', '""')}"`;
    const rows = [['Codice', 'Titolo', 'Tipo', 'Stato', 'Inizio', 'Fine', 'Luogo', 'Provincia', 'Posti', 'Iscritti', 'Quota']];
    for (const e of this.selected()) {
      rows.push([e.code, e.title, e.typeName, label(STATUS_LABELS, e.status), e.startDate, e.endDate, e.location, e.province, e.seats, e.enrolledCount, e.fee] as string[]);
    }
    const csv = '\uFEFF' + rows.map((r) => r.map(cell).join(';')).join('\r\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = 'eventi.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  /** Crea una bozza uguale a ciascun evento scelto (con "(copia)" nel titolo): serve a partire da un evento gia' fatto. */
  protected duplicateSelected(): void {
    this.bulk(this.selected(), (e) => this.api.invoke(eventCreate, { body: this.copyOf(e) }), 'duplicati');
  }

  protected duplicate(e: EventDto): void {
    this.act(this.api.invoke(eventCreate, { body: this.copyOf(e) }), 'Bozza creata: è una copia dell’evento.');
  }

  /** Pubblica quelli che si possono pubblicare; gli altri (o quelli con dati incoerenti) restano come sono e si contano a parte. */
  protected publishSelected(): void {
    this.bulk(
      this.selected().filter((e) => this.can(e, 'PUBLISH')),
      (e) => this.api.invoke(eventPublish, { id: e.id!, body: { version: e.version } }),
      'pubblicati',
    );
  }

  protected deleteSelected(): void {
    const deletable = this.selected().filter((e) => this.can(e, 'DELETE'));
    if (!deletable.length) {
      this.snackBar.open('Tra gli eventi scelti nessuno si può eliminare.', 'Chiudi', { duration: 5000 });
      return;
    }
    const messaggio = `${deletable.length === 1 ? 'Un evento verrà eliminato' : deletable.length + ' eventi verranno eliminati'}. Non si torna indietro.`;
    this.dialog
      .open<EventoConfermaComponent, unknown, boolean>(EventoConfermaComponent, { data: { azione: 'delete', titolo: '', messaggio } })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) this.bulk(deletable, (e) => this.api.invoke(eventDelete, { id: e.id! }), 'eliminati');
      });
  }

  /** Esegue l'azione su ogni evento e dice quanti sono andati a buon fine e quanti no. */
  private bulk(list: EventDto[], action: (e: EventDto) => Promise<unknown>, verb: string): void {
    if (!list.length) {
      this.snackBar.open('Nessuno degli eventi scelti può fare questa azione.', 'Chiudi', { duration: 5000 });
      return;
    }
    Promise.allSettled(list.map(action)).then((results) => {
      const ok = results.filter((r) => r.status === 'fulfilled').length;
      const ko = results.length - ok;
      this.snackBar.open(`${ok} ${ok === 1 ? 'evento' : 'eventi'} ${verb}${ko ? `, ${ko} no` : ''}.`, 'Chiudi', { duration: 5000 });
      this.clearSelection();
      this.load(this.pageIndex());
    });
  }

  private copyOf(e: EventDto): EventRequestDto {
    return {
      typeCode: e.typeCode!, level: e.level!, region: e.region, zone: e.zone ?? undefined, title: `${e.title ?? ''} (copia)`.trim(),
      description: e.description ?? undefined, location: e.location ?? undefined, province: e.province ?? undefined,
      startDate: e.startDate, endDate: e.endDate, registrationOpenDate: e.registrationOpenDate, registrationCloseDate: e.registrationCloseDate,
      seats: e.seats, fee: e.fee, enrollmentMode: e.enrollmentMode, requirements: e.requirements, obligations: e.obligations,
      contacts: e.contacts ?? undefined,
    };
  }

  /** Le azioni possibili le decide il backend (`availableActions`): qui si legge solo l'elenco. */
  protected can(e: EventDto, action: NonNullable<EventDto['availableActions']>[number]): boolean {
    return !!e.availableActions?.includes(action);
  }

  protected publish(e: EventDto): void {
    this.act(this.api.invoke(eventPublish, { id: e.id!, body: { version: e.version } }), 'Evento pubblicato.');
  }

  protected close(e: EventDto): void {
    this.act(this.api.invoke(eventCloseRegistrations, { id: e.id!, body: { version: e.version } }), 'Iscrizioni chiuse.');
  }

  /** Chiede il motivo in una finestra e poi annulla l'evento: il motivo lo ricevono tutti gli iscritti. */
  protected cancel(e: EventDto): void {
    this.dialog
      .open<EventoConfermaComponent, unknown, string>(EventoConfermaComponent, { data: { azione: 'cancel', titolo: e.title } })
      .afterClosed()
      .subscribe((reason) => {
        if (reason) this.act(this.api.invoke(eventCancel, { id: e.id!, body: { reason, version: e.version! } }), 'Evento annullato.');
      });
  }

  protected remove(e: EventDto): void {
    this.dialog
      .open<EventoConfermaComponent, unknown, boolean>(EventoConfermaComponent, { data: { azione: 'delete', titolo: e.title } })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) this.act(this.api.invoke(eventDelete, { id: e.id! }), 'Evento eliminato.');
      });
  }

  private act(request: Promise<unknown>, success: string): void {
    this.error.set(null);
    request.then(
      () => {
        this.snackBar.open(success, 'Chiudi', { duration: 4000 });
        this.load(this.pageIndex());
      },
      (e: ApiError) => this.error.set(e.details.length ? e.details.map((d) => d.message).join(' ') : e.message),
    );
  }

  private load(page: number): void {
    this.loading.set(true);
    this.clearSelection();
    const params: EventManaged$Params = { page, size: PAGE_SIZE };
    if (this.q.trim()) params.q = this.q.trim();
    params.sort = this.sort;
    if (this.status) params.status = this.status as EventManaged$Params['status'];
    this.api.invoke(eventManaged, params).then(
      (response) => {
        this.events.set(response.payload?.content ?? []);
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
