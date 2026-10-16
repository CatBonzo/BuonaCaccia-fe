import { HttpErrorResponse } from '@angular/common/http';

/** Errore dell'API nella forma dell'envelope: errorCode SSSNN, messaggio, dominio, campo (422). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly errorCode: number,
    message: string,
    readonly errorDomain?: string,
    readonly field?: string,
  ) {
    super(message);
  }

  static from(error: HttpErrorResponse): ApiError {
    const body = error.error as { errorCode?: number; errorMessage?: string; errorDomain?: string; payload?: { field?: string } } | null;
    if (body && typeof body === 'object' && body.errorCode) {
      return new ApiError(error.status, body.errorCode, body.errorMessage ?? 'Errore', body.errorDomain, body.payload?.field);
    }
    if (error.status === 0) {
      return new ApiError(0, 0, 'Il server non risponde. Riprova tra poco.');
    }
    return new ApiError(error.status, 0, 'Si è verificato un errore imprevisto.');
  }
}
