import { TestBed } from '@angular/core/testing';
import { StatoVuotoComponent } from './stato-vuoto.component';

describe('StatoVuotoComponent', () => {
  it('mostra il titolo e il suggerimento', async () => {
    await TestBed.configureTestingModule({ imports: [StatoVuotoComponent] }).compileComponents();
    const fixture = TestBed.createComponent(StatoVuotoComponent);
    fixture.componentRef.setInput('titolo', 'Nessun evento');
    fixture.componentRef.setInput('suggerimento', 'Togli un filtro');
    fixture.detectChanges();
    const testo = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(testo).toContain('Nessun evento');
    expect(testo).toContain('Togli un filtro');
  });
});
