import { Injectable } from '@angular/core';

/** Offre al browser un file ricevuto dal backend (il client generato lo restituisce come Blob). */
@Injectable({ providedIn: 'root' })
export class FileDownload {
  save(file: Blob, fileName: string): void {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
}
