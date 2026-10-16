import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Scarica un file dal backend e lo offre al browser. Il client generato descrive documenti e CSV come testo JSON,
 * quindi qui si chiede il file come Blob (con il Bearer aggiunto dall'intercettore).
 */
@Injectable({ providedIn: 'root' })
export class FileDownload {
  private readonly http = inject(HttpClient);

  download(path: string, fileName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get(`${environment.apiUrl}${path}`, { responseType: 'blob' }).subscribe({
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
