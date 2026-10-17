import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SegreteriaIscrizioniComponent } from './segreteria-iscrizioni.component';

describe('SegreteriaIscrizioniComponent', () => {
  it('si crea', async () => {
    await TestBed.configureTestingModule({
      imports: [SegreteriaIscrizioniComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const fixture = TestBed.createComponent(SegreteriaIscrizioniComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
