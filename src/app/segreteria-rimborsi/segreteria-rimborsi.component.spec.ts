import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SegreteriaRimborsiComponent } from './segreteria-rimborsi.component';

describe('SegreteriaRimborsiComponent', () => {
  it('si crea', async () => {
    await TestBed.configureTestingModule({
      imports: [SegreteriaRimborsiComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const fixture = TestBed.createComponent(SegreteriaRimborsiComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
