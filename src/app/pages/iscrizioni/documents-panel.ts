import { DatePipe } from '@angular/common';
import { Component, effect, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Api } from '../../api/api';
import { documentList } from '../../api/fn/documents/document-list';
import { documentUpload } from '../../api/fn/documents/document-upload';
import { DocumentDto, EnrollmentDto, EnrollmentObligationDto } from '../../api/models';
import { ApiError } from '../../core/api-error';
import { DocumentDownload } from '../../core/document-download';
import { DOCUMENT_STATUS_LABELS, formatBytes, label } from '../../core/labels';

/** I documenti richiesti da un'iscrizione: stato dell'ultimo caricato, motivo di un rifiuto e caricamento. */
@Component({
  selector: 'app-documents-panel',
  imports: [DatePipe, MatButtonModule],
  templateUrl: './documents-panel.html',
  styleUrl: './documents-panel.scss',
})
export class DocumentsPanel {
  private readonly api = inject(Api);
  private readonly snackBar = inject(MatSnackBar);
  private readonly downloader = inject(DocumentDownload);

  readonly enrollment = input.required<EnrollmentDto>();
  /** Avvisa la pagina quando un caricamento cambia lo stato dell'iscrizione. */
  readonly changed = output<void>();

  protected readonly documents = signal<DocumentDto[]>([]);
  protected readonly uploading = signal<string | null>(null);
  protected readonly errors = signal<Record<string, string>>({});

  protected readonly statusLabels = DOCUMENT_STATUS_LABELS;
  protected readonly labelOf = label;
  protected readonly formatBytes = formatBytes;

  constructor() {
    effect(() => this.load(this.enrollment().id!));
  }

  /** Gli adempimenti di tipo documento che hanno un codice con cui caricare. */
  protected requirements(): EnrollmentObligationDto[] {
    return (this.enrollment().obligations ?? []).filter((o) => o.type === 'DOCUMENT' && o.status !== 'NOT_REQUIRED' && o.code);
  }

  /** L'ultimo documento caricato per quel codice, ignorando quelli sostituiti. */
  protected current(code: string): DocumentDto | undefined {
    return this.documents()
      .filter((d) => d.code === code && d.status !== 'REPLACED')
      .sort((a, b) => (b.uploadedAt ?? '').localeCompare(a.uploadedAt ?? ''))[0];
  }

  protected accept(o: EnrollmentObligationDto): string {
    return (o.allowedMimeTypes?.length ? o.allowedMimeTypes : ['application/pdf', 'image/jpeg', 'image/png']).join(',');
  }

  protected canUpload(o: EnrollmentObligationDto): boolean {
    return !!this.enrollment().active && (o.status === 'TODO' || o.status === 'REJECTED' || o.status === 'IN_REVIEW');
  }

  protected download(doc: DocumentDto): void {
    void this.downloader.download(doc.id!, doc.originalName ?? 'documento').catch(() => this.snackBar.open('Download non riuscito.', 'Chiudi', { duration: 5000 }));
  }

  protected onFile(o: EnrollmentObligationDto, input: HTMLInputElement): void {
    const file = input.files?.[0];
    if (!file) return;
    const code = o.code!;
    this.uploading.set(code);
    this.errors.update((e) => ({ ...e, [code]: '' }));
    this.api.invoke(documentUpload, { id: this.enrollment().id!, code, body: { file } }).then(
      () => {
        this.uploading.set(null);
        input.value = '';
        this.snackBar.open('Documento caricato.', 'Chiudi', { duration: 4000 });
        this.load(this.enrollment().id!);
        this.changed.emit();
      },
      (e: ApiError) => {
        this.uploading.set(null);
        input.value = '';
        this.errors.update((all) => ({ ...all, [code]: e.details[0]?.message ?? e.message }));
      },
    );
  }

  private load(enrollmentId: string): void {
    this.api.invoke(documentList, { id: enrollmentId }).then(
      (response) => this.documents.set(response.payload ?? []),
      () => this.documents.set([]),
    );
  }
}
