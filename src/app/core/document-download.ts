import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Scarica il contenuto di un documento. Il client generato lo descrive come testo JSON,
 * quindi qui si chiede il file come Blob (con il Bearer aggiunto dall'intercettore).
 */
@Injectable({ providedIn: 'root' })
export class DocumentDownload {
  private readonly http = inject(HttpClient);

  download(documentId: string, fileName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get(`${environment.apiUrl}/api/v1/documents/${documentId}/content`, { responseType: 'blob' }).subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.click();
          URL.revokeObjectURL(url);
          resolve();
        },
        error: reject,
      });
    });
  }
}
