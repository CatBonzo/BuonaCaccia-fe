import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from './api-error';

describe('ApiError', () => {
  it("legge l'envelope del backend", () => {
    const e = ApiError.from(
      new HttpErrorResponse({ status: 422, error: { errorCode: 42200, errorMessage: 'Dato non valido', errorDomain: 'EVENT', payload: { field: 'title' } } }),
    );
    expect(e.status).toBe(422);
    expect(e.errorCode).toBe(42200);
    expect(e.field).toBe('title');
    expect(e.message).toBe('Dato non valido');
  });

  it('se il server non risponde dice di riprovare', () => {
    const e = ApiError.from(new HttpErrorResponse({ status: 0 }));
    expect(e.message).toContain('Riprova');
  });
});
