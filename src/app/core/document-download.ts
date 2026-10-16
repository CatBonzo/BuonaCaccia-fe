import { Injectable, inject } from '@angular/core';
import { FileDownload } from './file-download';

/** Scarica il contenuto di un documento (vedi FileDownload: il contratto lo descrive come testo JSON). */
@Injectable({ providedIn: 'root' })
export class DocumentDownload {
  private readonly files = inject(FileDownload);

  download(documentId: string, fileName: string): Promise<void> {
    return this.files.download(`/api/v1/documents/${documentId}/content`, fileName);
  }
}
