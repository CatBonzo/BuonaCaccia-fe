import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CapiIscrizioniComponent } from './capi-iscrizioni.component';

describe('CapiIscrizioniComponent', () => {
  it('si crea', async () => {
    await TestBed.configureTestingModule({
      imports: [CapiIscrizioniComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const fixture = TestBed.createComponent(CapiIscrizioniComponent);
    fixture.componentRef.setInput('mode', 'toAuthorize');
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
