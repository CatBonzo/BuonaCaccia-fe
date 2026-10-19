import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IconFieldModule } from '@openng/optimus-ui/iconfield';
import { InputIconModule } from '@openng/optimus-ui/inputicon';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { MultiSelectModule } from '@openng/optimus-ui/multiselect';
import { SelectModule } from '@openng/optimus-ui/select';
import { Table, TableFilterEvent, TableModule } from '@openng/optimus-ui/table';
import { TagModule } from '@openng/optimus-ui/tag';
import { Api } from '../api/api';
import { eventCreate } from '../api/fn/events/event-create';
import { eventCancel } from '../api/fn/events/event-cancel';
import { eventDelete } from '../api/fn/events/event-delete';
import { eventCloseRegistrations } from '../api/fn/events/event-close-registrations';
import { eventManaged, EventManaged$Params } from '../api/fn/events/event-managed';
import { eventPublish } from '../api/fn/events/event-publish';
import { EventDto, EventRequestDto } from '../api/models';
import { ApiError } from '../core/api-error';
import { REGION_NAMES, STATUS_LABELS, label } from '../core/labels';
import { SessionService } from '../core/session.service';
import { EventoConfermaComponent } from '../evento-conferma/evento-conferma.component';

const PAGE_SIZE = 12;
/** Il backend dà al massimo 100 eventi per pagina: l'elenco si scarica a pagine e poi si filtra nella tabella. */
const FETCH_SIZE = 100;

/** Una riga della tabella: l'evento più i testi già pronti per cercarci dentro. */
type Row = EventDto & { regionName: string; statusLabel: string };
type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

/** Gli eventi della propria regione, in qualunque stato, in una tabella Optimus (`p-table`): si vede, si modifica, si elimina; le altre azioni stanno nel menu della riga. */
@Component({
  selector: 'app-segreteria-eventi',
  imports: [
    FormsModule, RouterLink, MatButtonModule, MatDialogModule, MatMenuModule, MatTooltipModule,
    IconFieldModule, InputIconModule, InputTextModule, MultiSelectModule, SelectModule, TableModule, TagModule,
  ],
  templateUrl: './segreteria-eventi.component.html',
  styleUrl: './segreteria-eventi.component.scss',
})
export class SegreteriaEventiComponent {
  private readonly api = inject(Api);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  protected readonly session = inject(SessionService);

  protected readonly events = signal<Row[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly labelOf = label;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly pageSize = PAGE_SIZE;
  protected readonly statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({ label, value }));
  /** Le scelte dei filtri a tendina vengono dagli eventi che ci sono, non da un elenco fisso. */
  protected readonly typeOptions = computed(() => [...new Set(this.events().map((e) => e.typeCode).filter((t): t is string => !!t))].sort());
  protected readonly regionOptions = computed(() =>
    [...new Set(this.events().map((e) => e.region as string).filter(Boolean))].map((value) => ({ value, label: REGION_NAMES[value] ?? value })),
  );

  /** Le righe scelte con le caselle (le gestisce la tabella): servono alla barra delle azioni in basso. */
  /** Quante righe passano i filtri: la tabella lo dice a ogni filtro. */
  protected readonly visibleCount = signal(0);
  protected readonly selected = signal<Row[]>([]);

  constructor() {
    this.load();
  }

  protected severityOf(status: string | undefined): Severity {
    switch (status) {
      case 'REGISTRATION_OPEN':
      case 'PUBLISHED':
        return 'success';
      case 'REGISTRATION_CLOSED':
        return 'warn';
      case 'IN_PROGRESS':
        return 'info';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  protected onFilter(event: TableFilterEvent): void {
    this.visibleCount.set(event.filteredValue?.length ?? this.events().length);
  }

  protected resetFilters(table: Table): void {
    table.clear();
    this.visibleCount.set(this.events().length);
  }

  protected clearSelection(): void {
    this.selected.set([]);
  }

  /** Scarica le righe scelte in un file CSV (separatore `;` e segno di codifica, cosi' Excel in italiano lo apre bene). */
  protected exportSelected(): void {
    const cell = (v: unknown) => `"${String(v ?? '').replaceAll('"', '""')}"`;
    const rows = [['Codice', 'Titolo', 'Tipo', 'Stato', 'Inizio', 'Fine', 'Luogo', 'Provincia', 'Posti', 'Iscritti', 'Quota']];
    for (const e of this.selected()) {
      rows.push([e.code, e.title, e.typeCode, label(STATUS_LABELS, e.status), e.startDate, e.endDate, e.location, e.province, e.seats, e.enrolledCount, e.fee] as string[]);
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
      this.load();
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
        this.load();
      },
      (e: ApiError) => this.error.set(e.details.length ? e.details.map((d) => d.message).join(' ') : e.message),
    );
  }

  /** Scarica tutte le pagine degli eventi della regione: poi filtri, ricerca e pagine si fanno nella tabella. */
  private async load(): Promise<void> {
    this.loading.set(true);
    this.clearSelection();
    try {
      const rows: Row[] = [];
      for (let page = 0, pages = 1; page < pages; page++) {
        const params: EventManaged$Params = { page, size: FETCH_SIZE, sort: 'createdAt,desc' };
        const payload = (await this.api.invoke(eventManaged, params)).payload;
        pages = payload?.totalPages ?? 1;
        for (const e of payload?.content ?? []) {
          rows.push({ ...e, regionName: REGION_NAMES[e.region ?? ''] ?? e.region ?? '', statusLabel: label(STATUS_LABELS, e.status) });
        }
      }
      this.events.set(rows);
      this.visibleCount.set(rows.length);
    } catch (e) {
      this.error.set((e as ApiError).message);
    } finally {
      this.loading.set(false);
    }
  }
}
