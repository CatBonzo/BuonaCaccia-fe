import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AmministrazioneTipiEventoComponent } from './amministrazione-tipi-evento.component';

describe('AmministrazioneTipiEventoComponent', () => {
  it('si crea', async () => {
    await TestBed.configureTestingModule({
      imports: [AmministrazioneTipiEventoComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const fixture = TestBed.createComponent(AmministrazioneTipiEventoComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
