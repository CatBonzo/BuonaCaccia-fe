import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Api } from '../../api/api';
import { documentQueue, DocumentQueue$Params } from '../../api/fn/documents/document-queue';
import { documentReject } from '../../api/fn/documents/document-reject';
import { documentValidate } from '../../api/fn/documents/document-validate';
import { eventManaged } from '../../api/fn/events/event-managed';
import { DocumentDto, EventDto } from '../../api/models';
import { ApiError } from '../../core/api-error';
import { DocumentDownload } from '../../core/document-download';
import { DOCUMENT_STATUS_LABELS, formatBytes, label } from '../../core/labels';

const PAGE_SIZE = 12;

/** Documenti caricati dai soci della propria regione, dal più vecchio: la segreteria li guarda, li valida o li rifiuta con un motivo. */
@Component({
  selector: 'app-document-queue',
  imports: [
    DatePipe, FormsModule, MatButtonModule, MatCardModule, MatChipsModule, MatFormFieldModule, MatInputModule, MatPaginatorModule,
    MatProgressBarModule, MatSelectModule,
  ],
  templateUrl: './document-queue.html',
  styleUrl: './document-queue.scss',
})
export class DocumentQueue {
  private readonly api = inject(Api);
  private readonly snackBar = inject(MatSnackBar);
  private readonly downloader = inject(DocumentDownload);

  protected readonly events = signal<EventDto[]>([]);
  protected readonly documents = signal<DocumentDto[]>([]);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly statuses = Object.entries(DOCUMENT_STATUS_LABELS);
  protected readonly labelOf = label;
  protected readonly statusLabels = DOCUMENT_STATUS_LABELS;
  protected readonly size = formatBytes;
  protected readonly pageSize = PAGE_SIZE;
  protected status = 'UPLOADED';
  protected eventId = '';

  /** Documento per cui si sta scrivendo il motivo del rifiuto. */
  protected readonly rejecting = signal<string | null>(null);
  protected reason = '';

  constructor() {
    this.api.invoke(eventManaged, { size: 100, sort: 'title,asc' }).then(
      (r) => this.events.set((r.payload?.content ?? []).filter((e) => e.status !== 'DRAFT')),
      () => undefined,
    );
    this.load(0);
  }

  protected filter(): void {
    this.load(0);
  }

  protected onPage(event: PageEvent): void {
    this.load(event.pageIndex);
  }

  protected open(d: DocumentDto): void {
    this.downloader.download(d.id!, d.originalName ?? 'documento').catch(() => this.error.set('Non riesco a scaricare il documento.'));
  }

  protected validate(d: DocumentDto): void {
    this.act(this.api.invoke(documentValidate, { id: d.id! }), 'Documento validato.');
  }

  protected startReject(d: DocumentDto): void {
    this.rejecting.set(d.id!);
    this.reason = '';
  }

  protected reject(d: DocumentDto): void {
    if (!this.reason.trim()) {
      this.error.set('Scrivi il motivo del rifiuto: lo riceve il socio.');
      return;
    }
    this.act(this.api.invoke(documentReject, { id: d.id!, body: { reason: this.reason.trim() } }), 'Documento rifiutato.');
  }

  private act(request: Promise<unknown>, success: string): void {
    this.error.set(null);
    request.then(
      () => {
        this.rejecting.set(null);
        this.snackBar.open(success, 'Chiudi', { duration: 4000 });
        this.load(this.pageIndex());
      },
      (e: ApiError) => this.error.set(e.details.length ? e.details.map((d) => d.message).join(' ') : e.message),
    );
  }

  private load(page: number): void {
    this.loading.set(true);
    const params: DocumentQueue$Params = { page, size: PAGE_SIZE };
    if (this.eventId) params.eventId = this.eventId;
    if (this.status) params.status = this.status as DocumentQueue$Params['status'];
    this.api.invoke(documentQueue, params).then(
      (response) => {
        this.documents.set(response.payload?.content ?? []);
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
