import { DatePipe, CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { Api } from '../../api/api';
import { eventSearch, EventSearch$Params } from '../../api/fn/events/event-search';
import { regionFindAll } from '../../api/fn/regions/region-find-all';
import { EventDto, RegionDto } from '../../api/models';
import { ApiError } from '../../core/api-error';
import { AVAILABILITY_LABELS, CATEGORY_LABELS, SORT_OPTIONS, STATUS_LABELS, label } from '../../core/labels';

const PAGE_SIZE = 12;

interface MonthGroup {
  label: string;
  events: EventDto[];
}

const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

/** Stato dei posti in tre toni: aperto, quasi pieno, chiuso. Serve a colorare il segno a sinistra della riga. */
export function seatTone(availability: string | undefined): 'ok' | 'warn' | 'closed' {
  if (availability === 'OPEN') return 'ok';
  if (availability === 'LIMITED' || availability === 'HEAVY_OVERBOOKING') return 'warn';
  return 'closed';
}

/** Catalogo pubblico: cerca per testo, regione, categoria, disponibilita' e date, con ordinamento e pagine. */
@Component({
  selector: 'app-event-list',
  imports: [
    DatePipe, CurrencyPipe, FormsModule, RouterLink, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatPaginatorModule, MatProgressBarModule, MatSelectModule,
  ],
  templateUrl: './event-list.html',
  styleUrl: './event-list.scss',
})
export class EventList {
  private readonly api = inject(Api);

  protected readonly categories = Object.entries(CATEGORY_LABELS);
  protected readonly availabilities = Object.entries(AVAILABILITY_LABELS);
  protected readonly sorts = SORT_OPTIONS;
  protected readonly regions = signal<RegionDto[]>([]);

  protected readonly events = signal<EventDto[]>([]);
  protected readonly total = signal(0);
  protected readonly moreFilters = signal(false);

  /** Con l'ordine per data gli eventi si raggruppano per mese, come in un'agenda; altrimenti restano in elenco. */
  protected readonly groups = computed<MonthGroup[]>(() => {
    const list = this.events();
    if (!this.sort.startsWith('startDate')) return [{ label: '', events: list }];
    const groups: MonthGroup[] = [];
    for (const event of list) {
      const [year, month] = (event.startDate ?? '').split('-').map(Number);
      const label = `${MONTHS[(month ?? 1) - 1]} ${year}`;
      const last = groups[groups.length - 1];
      if (last?.label === label) last.events.push(event);
      else groups.push({ label, events: [event] });
    }
    return groups;
  });
  protected readonly pageIndex = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected q = '';
  protected region = '';
  protected category = '';
  protected availability = '';
  protected startFrom = '';
  protected startTo = '';
  protected sort = SORT_OPTIONS[0].value;
  protected readonly pageSize = PAGE_SIZE;

  protected readonly labelOf = label;
  protected readonly tone = seatTone;

  /** La branca in minuscolo breve, per scegliere il colore della data nello stile. */
  protected catKey(category: string | undefined): string {
    return { LC: 'lc', EG: 'eg', RS: 'rs', LEADER_TRAINING: 'leader', ASSOCIATION: 'assoc' }[category ?? ''] ?? 'assoc';
  }

  /** Giorni dell'evento ("10–12" o "10") per il blocco della data. */
  protected days(event: EventDto): string {
    const start = Number((event.startDate ?? '').slice(8, 10));
    const end = Number((event.endDate ?? '').slice(8, 10));
    const sameMonth = (event.startDate ?? '').slice(0, 7) === (event.endDate ?? '').slice(0, 7);
    if (event.startDate === event.endDate) return String(start);
    return sameMonth ? `${start}–${end}` : `${start}`;
  }

  protected monthShort(event: EventDto): string {
    return MONTHS[Number((event.startDate ?? '').slice(5, 7)) - 1]?.slice(0, 3) ?? '';
  }

  protected activeFilters(): number {
    return [this.availability, this.startFrom, this.startTo].filter(Boolean).length;
  }
  protected readonly categoryLabels = CATEGORY_LABELS;
  protected readonly availabilityLabels = AVAILABILITY_LABELS;
  protected readonly statusLabels = STATUS_LABELS;

  constructor() {
    this.api.invoke(regionFindAll).then((r) => this.regions.set(r.payload ?? []), () => undefined);
    this.search(0);
  }

  protected apply(): void {
    this.search(0);
  }

  protected reset(): void {
    this.q = this.region = this.category = this.availability = this.startFrom = this.startTo = '';
    this.sort = SORT_OPTIONS[0].value;
    this.search(0);
  }

  protected onPage(event: PageEvent): void {
    this.search(event.pageIndex);
  }

  /** Costruisce i parametri: i filtri vuoti non vengono inviati. */
  private params(page: number): EventSearch$Params {
    const params: EventSearch$Params = { page, size: PAGE_SIZE, sort: this.sort };
    if (this.q.trim()) params.q = this.q.trim();
    if (this.region) params.region = this.region as EventSearch$Params['region'];
    if (this.category) params.category = this.category as EventSearch$Params['category'];
    if (this.availability) params.availability = this.availability as EventSearch$Params['availability'];
    if (this.startFrom) params.startFrom = this.startFrom;
    if (this.startTo) params.startTo = this.startTo;
    return params;
  }

  private search(page: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.invoke(eventSearch, this.params(page)).then(
      (response) => {
        const result = response.payload;
        this.events.set(result?.content ?? []);
        this.total.set(result?.totalElements ?? 0);
        this.pageIndex.set(result?.page ?? page);
        this.loading.set(false);
      },
      (e: ApiError) => {
        this.error.set(e.field ? `${e.message} (${e.field})` : e.message);
        this.loading.set(false);
      },
    );
  }
}
