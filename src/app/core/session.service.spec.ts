import { TestBed } from '@angular/core/testing';
import { MockUserResponse } from '../api/models';
import { SessionService } from './session.service';

const segreteria: MockUserResponse = {
  username: 'segreteria',
  firstName: 'Sara',
  lastName: 'Segretaria',
  accessToken: 'tok',
  authentication: {
    isMemberOf: 'agesci:PIE:segreteria',
    role: ['agesci:regione:segreteria'],
    entitlement: ['agesci:entitlement:evento:gestione', 'agesci:entitlement:iscrizione:gestione'],
  },
};

describe('SessionService', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.resetTestingModule();
  });

  it('parte senza utente', () => {
    const s = TestBed.inject(SessionService);
    expect(s.loggedIn()).toBe(false);
    expect(s.token()).toBeNull();
  });

  it('dopo il login espone nome, ruoli e permessi in forma breve', () => {
    const s = TestBed.inject(SessionService);
    s.login(segreteria);
    expect(s.fullName()).toBe('Sara Segretaria');
    expect(s.hasRole('agesci:regione:segreteria')).toBe(true);
    expect(s.can('evento:gestione')).toBe(true);
    expect(s.can('tipoevento:gestione')).toBe(false);
    expect(s.token()).toBe('tok');
  });

  it('la sessione sopravvive al ricaricamento e finisce con il logout', () => {
    TestBed.inject(SessionService).login(segreteria);
    TestBed.resetTestingModule();
    const reloaded = TestBed.inject(SessionService);
    expect(reloaded.loggedIn()).toBe(true);
    reloaded.logout();
    expect(reloaded.loggedIn()).toBe(false);
    expect(sessionStorage.getItem('buonacaccia.session')).toBeNull();
  });

  it('ricava la regione della segreteria da isMemberOf', () => {
    const s = TestBed.inject(SessionService);
    s.login(segreteria);
    expect(s.regionCode()).toBe('PIE');
    s.login({ ...segreteria, authentication: { ...segreteria.authentication!, isMemberOf: 'agesci:socio:true' } });
    expect(s.regionCode()).toBe('');
  });
});
