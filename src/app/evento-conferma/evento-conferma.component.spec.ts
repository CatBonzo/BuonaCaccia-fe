import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EventoConfermaComponent } from './evento-conferma.component';

describe('EventoConfermaComponent', () => {
  async function crea(azione: 'delete' | 'cancel') {
    await TestBed.configureTestingModule({
      imports: [EventoConfermaComponent],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: { azione, titolo: 'Route di prova' } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(EventoConfermaComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('per eliminare chiede solo conferma', async () => {
    const el = await crea('delete');
    expect(el.textContent).toContain('Route di prova');
    expect(el.querySelector('[data-testid="confirm-delete"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="cancel-reason"]')).toBeNull();
  });

  it('per annullare vuole il motivo: senza il pulsante e\' spento', async () => {
    const el = await crea('cancel');
    expect(el.querySelector('[data-testid="cancel-reason"]')).toBeTruthy();
    expect((el.querySelector('[data-testid="confirm-cancel"]') as HTMLButtonElement).disabled).toBe(true);
  });
});
