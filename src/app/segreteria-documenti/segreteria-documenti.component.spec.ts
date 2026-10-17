import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SegreteriaDocumentiComponent } from './segreteria-documenti.component';

describe('SegreteriaDocumentiComponent', () => {
  it('si crea', async () => {
    await TestBed.configureTestingModule({
      imports: [SegreteriaDocumentiComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const fixture = TestBed.createComponent(SegreteriaDocumentiComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
