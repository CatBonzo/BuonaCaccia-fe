import { Injectable, inject } from '@angular/core';
import { Api } from '../api/api';
import { documentContent } from '../api/fn/documents/document-content';
import { FileDownload } from './file-download';

/** Scarica il contenuto di un documento con il nome originale. */
@Injectable({ providedIn: 'root' })
export class DocumentDownload {
  private readonly api = inject(Api);
  private readonly files = inject(FileDownload);

  async download(documentId: string, fileName: string): Promise<void> {
    this.files.save(await this.api.invoke(documentContent, { id: documentId }), fileName);
  }
}
