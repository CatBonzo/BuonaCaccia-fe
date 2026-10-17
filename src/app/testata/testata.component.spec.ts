import { TestBed } from '@angular/core/testing';
import { TestataComponent } from './testata.component';

describe('TestataComponent', () => {
  it('mostra il titolo e la spiegazione', async () => {
    await TestBed.configureTestingModule({ imports: [TestataComponent] }).compileComponents();
    const fixture = TestBed.createComponent(TestataComponent);
    fixture.componentRef.setInput('titolo', 'Buona caccia!');
    fixture.componentRef.setInput('introduzione', 'Trova il prossimo evento');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toBe('Buona caccia!');
    expect(el.querySelector('.lead')?.textContent).toContain('Trova il prossimo evento');
  });
});
