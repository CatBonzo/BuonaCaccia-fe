import { DatePipe, CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
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

/** Catalogo pubblico: cerca per testo, regione, categoria, disponibilita' e date, con ordinamento e pagine. */
@Component({
  selector: 'app-event-list',
  imports: [
    DatePipe, CurrencyPipe, FormsModule, RouterLink, MatButtonModule, MatCardModule, MatChipsModule,
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
