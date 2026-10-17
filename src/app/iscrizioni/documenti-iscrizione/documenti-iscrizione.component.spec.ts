import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DocumentiIscrizioneComponent } from './documenti-iscrizione.component';

describe('DocumentiIscrizioneComponent', () => {
  it('si crea', async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentiIscrizioneComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const fixture = TestBed.createComponent(DocumentiIscrizioneComponent);
    fixture.componentRef.setInput('enrollment', { id: 'i1', obligations: [] });
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
