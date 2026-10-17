import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  beforeEach(() => sessionStorage.clear());

  it('mostra Home, Eventi, Aiuto e Info e, senza accesso, il pulsante Accedi', async () => {
    await TestBed.configureTestingModule({ imports: [NavbarComponent], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const voci = Array.from(el.querySelectorAll('.links a')).map((a) => a.textContent?.trim());
    expect(voci).toEqual(['Home', 'Eventi', 'Aiuto', 'Info']);
    expect(el.querySelector('[data-testid="login"]')?.textContent).toContain('Accedi');
  });
});
