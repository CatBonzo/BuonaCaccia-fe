import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EventDto } from '../../api/models';
import { EventoRigaComponent, categoryKey, seatTone } from './evento-riga.component';

registerLocaleData(localeIt);

describe('EventoRigaComponent', () => {
  const evento = {
    id: 'e1', code: 'PIE-2027-001', title: 'Route di prova', typeName: 'Route', location: 'Pian del Re', region: 'PIE',
    startDate: '2027-03-10', endDate: '2027-03-12', fee: 50, availability: 'OPEN', category: 'RS', status: 'PUBLISHED',
  } as unknown as EventDto;

  it('mostra i giorni, il titolo e il colore della branca', async () => {
    await TestBed.configureTestingModule({ imports: [EventoRigaComponent], providers: [provideRouter([]), { provide: LOCALE_ID, useValue: 'it' }] }).compileComponents();
    const fixture = TestBed.createComponent(EventoRigaComponent);
    fixture.componentRef.setInput('event', evento);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.day')?.textContent).toBe('10–12');
    expect(el.querySelector('.mon')?.textContent).toBe('mar');
    expect(el.querySelector('.title a')?.textContent).toBe('Route di prova');
    expect(el.getAttribute('data-cat')).toBe('rs');
    expect(el.getAttribute('data-tone')).toBe('ok');
  });

  it('il tono dei posti e il colore della branca seguono i valori del backend', () => {
    expect(seatTone('LIMITED')).toBe('warn');
    expect(seatTone('CLOSED')).toBe('closed');
    expect(categoryKey('LEADER_TRAINING')).toBe('leader');
    expect(categoryKey(undefined)).toBe('assoc');
  });
});
