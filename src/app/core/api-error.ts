import { HttpErrorResponse } from '@angular/common/http';

/** Un motivo preciso dell'errore: di solito un campo e il suo messaggio. */
export interface ApiErrorDetail {
  field?: string;
  message: string;
}

/** Errore dell'API nella forma dell'envelope: errorCode SSSNN, messaggio, dominio e motivi (422). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly errorCode: number,
    message: string,
    readonly errorDomain?: string,
    readonly details: ApiErrorDetail[] = [],
  ) {
    super(message);
  }

  /** Il primo campo indicato dal backend, se c'e'. */
  get field(): string | undefined {
    return this.details.find((d) => d.field)?.field;
  }

  static from(error: HttpErrorResponse): ApiError {
    const body = error.error as { errorCode?: number; errorMessage?: string; errorDomain?: string; payload?: unknown } | null;
    if (body && typeof body === 'object' && body.errorCode) {
      return new ApiError(error.status, body.errorCode, body.errorMessage ?? 'Errore', body.errorDomain, ApiError.detailsOf(body.payload));
    }
    if (error.status === 0) {
      return new ApiError(0, 0, 'Il server non risponde. Riprova tra poco.');
    }
    return new ApiError(error.status, 0, 'Si è verificato un errore imprevisto.');
  }

  /** Il payload d'errore e' un oggetto `{field, message}` oppure un elenco di essi. */
  private static detailsOf(payload: unknown): ApiErrorDetail[] {
    const items = Array.isArray(payload) ? payload : payload ? [payload] : [];
    return items
      .filter((i): i is { field?: string; message: string } => !!i && typeof i === 'object' && typeof (i as { message?: unknown }).message === 'string')
      .map((i) => ({ field: i.field, message: i.message }));
  }
}
