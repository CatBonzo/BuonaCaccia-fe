import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EventoDettaglioComponent } from './evento-dettaglio.component';

describe('EventoDettaglioComponent', () => {
  it('si crea', async () => {
    await TestBed.configureTestingModule({
      imports: [EventoDettaglioComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const fixture = TestBed.createComponent(EventoDettaglioComponent);
    fixture.componentRef.setInput('id', 'e1');
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
