import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from './api-error';

describe('ApiError', () => {
  it("legge l'envelope del backend con un solo campo", () => {
    const e = ApiError.from(
      new HttpErrorResponse({ status: 422, error: { errorCode: 42200, errorMessage: 'Dato non valido', errorDomain: 'EVENT', payload: { field: 'title', message: 'Obbligatorio' } } }),
    );
    expect(e.status).toBe(422);
    expect(e.errorCode).toBe(42200);
    expect(e.field).toBe('title');
    expect(e.details).toEqual([{ field: 'title', message: 'Obbligatorio' }]);
  });

  it('legge un elenco di motivi, come nei requisiti non rispettati', () => {
    const e = ApiError.from(
      new HttpErrorResponse({
        status: 422,
        error: { errorCode: 42210, errorMessage: 'Requisiti', payload: [{ field: 'age', message: 'Troppo giovane' }, { field: 'branch', message: 'Branca non ammessa' }] },
      }),
    );
    expect(e.details.map((d) => d.message)).toEqual(['Troppo giovane', 'Branca non ammessa']);
  });

  it('se il server non risponde dice di riprovare', () => {
    expect(ApiError.from(new HttpErrorResponse({ status: 0 })).message).toContain('Riprova');
  });
});
