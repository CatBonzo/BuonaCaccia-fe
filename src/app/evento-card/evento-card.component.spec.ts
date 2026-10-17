import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EventDto } from '../api/models';
import { EventoCardComponent, categoryKey, seatTone } from './evento-card.component';

registerLocaleData(localeIt);

describe('EventoCardComponent', () => {
  const evento = {
    id: 'e1', code: 'PIE-2027-001', title: 'Route di prova', typeCode: 'ROSS', typeName: 'Route', location: 'Pian del Re', province: 'CN',
    region: 'PIE', level: 'REGIONAL', startDate: '2027-03-10', endDate: '2027-03-12', fee: 50, seats: 30, enrolledCount: 1,
    availability: 'OPEN', category: 'RS', status: 'PUBLISHED',
  } as unknown as EventDto;

  async function crea(e: EventDto) {
    await TestBed.configureTestingModule({ imports: [EventoCardComponent], providers: [provideRouter([]), { provide: LOCALE_ID, useValue: 'it' }] }).compileComponents();
    const fixture = TestBed.createComponent(EventoCardComponent);
    fixture.componentRef.setInput('event', e);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('mostra tipo, titolo, luogo, regione per esteso, posti e quota', async () => {
    const el = await crea(evento);
    expect(el.querySelector('.type')?.textContent).toBe('ROSS');
    expect(el.querySelector('.title a')?.textContent).toBe('Route di prova');
    expect(el.textContent).toContain('Pian del Re (CN)');
    expect(el.textContent).toContain('Piemonte');
    expect(el.textContent).toContain('29 posti disponibili');
    expect(el.querySelector('.count')?.textContent).toBe('1/30');
    expect(el.getAttribute('data-cat')).toBe('rs');
    expect(el.getAttribute('data-tone')).toBe('ok');
  });

  it('per un evento nazionale scrive "Nazionale" e a posti finiti lo dice', async () => {
    const el = await crea({ ...evento, level: 'NATIONAL', enrolledCount: 30, availability: 'CLOSED' } as unknown as EventDto);
    expect(el.querySelector('.sub')?.textContent).toBe('Nazionale');
    expect(el.textContent).toContain('Posti esauriti');
  });

  it('il tono dei posti e il colore della branca seguono i valori del backend', () => {
    expect(seatTone('LIMITED')).toBe('warn');
    expect(seatTone('CLOSED')).toBe('closed');
    expect(categoryKey('LEADER_TRAINING')).toBe('leader');
    expect(categoryKey(undefined)).toBe('assoc');
  });
});
