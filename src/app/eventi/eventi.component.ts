import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { Api } from '../api/api';
import { eventSearch, EventSearch$Params } from '../api/fn/events/event-search';
import { regionFindAll } from '../api/fn/regions/region-find-all';
import { EventDto, RegionDto } from '../api/models';
import { ApiError } from '../core/api-error';
import { SORT_OPTIONS } from '../core/labels';
import { StatoVuotoComponent } from '../stato-vuoto/stato-vuoto.component';
import { TestataComponent } from '../testata/testata.component';
import { EventoRigaComponent } from './evento-riga/evento-riga.component';
import { FiltriEventi, FiltriEventiComponent } from './filtri-eventi/filtri-eventi.component';

const PAGE_SIZE = 12;

interface MonthGroup {
  label: string;
  events: EventDto[];
}

const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

/** Pagina /eventi, pubblica: la testata con i filtri, poi gli eventi raggruppati per mese e le pagine. */
@Component({
  selector: 'app-eventi',
  imports: [
    FormsModule, PaginatorModule, ProgressBarModule, SelectModule,
    TestataComponent, FiltriEventiComponent, EventoRigaComponent, StatoVuotoComponent,
  ],
  templateUrl: './eventi.component.html',
  styleUrl: './eventi.component.scss',
})
export class EventiComponent {
  private readonly api = inject(Api);

  protected readonly sorts = SORT_OPTIONS;
  protected readonly regions = signal<RegionDto[]>([]);

  protected readonly events = signal<EventDto[]>([]);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  private filters: Partial<FiltriEventi> = {};
  protected sort = SORT_OPTIONS[0].value;
  protected readonly pageSize = PAGE_SIZE;

  /** Con l'ordine per data gli eventi si raggruppano per mese, come in un'agenda; altrimenti restano in elenco. */
  protected readonly groups = computed<MonthGroup[]>(() => {
    const list = this.events();
    if (!this.sortByDate()) return [{ label: '', events: list }];
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
  private readonly sortByDate = signal(true);

  constructor() {
    this.api.invoke(regionFindAll).then((r) => this.regions.set(r.payload ?? []), () => undefined);
    this.search(0);
  }

  protected onFilters(filters: FiltriEventi): void {
    this.filters = filters;
    this.search(0);
  }

  protected onSort(): void {
    this.sortByDate.set(this.sort.startsWith('startDate'));
    this.search(0);
  }

  protected onPage(event: PaginatorState): void {
    this.search(event.page ?? 0);
  }

  /** Costruisce i parametri: i filtri vuoti non vengono inviati. */
  private params(page: number): EventSearch$Params {
    const f = this.filters;
    const params: EventSearch$Params = { page, size: PAGE_SIZE, sort: this.sort };
    if (f.q?.trim()) params.q = f.q.trim();
    if (f.region) params.region = f.region as EventSearch$Params['region'];
    if (f.category) params.category = f.category as EventSearch$Params['category'];
    if (f.availability) params.availability = f.availability as EventSearch$Params['availability'];
    if (f.startFrom) params.startFrom = f.startFrom;
    if (f.startTo) params.startTo = f.startTo;
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
