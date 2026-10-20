import { TestBed } from '@angular/core/testing';
import { EventoDomandeComponent } from './evento-domande.component';

describe('EventoDomandeComponent', () => {
  it('senza domande lo dice e permette di aggiungere una sezione', async () => {
    await TestBed.configureTestingModule({ imports: [EventoDomandeComponent] }).compileComponents();
    const fixture = TestBed.createComponent(EventoDomandeComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="domande-vuote"]')).toBeTruthy();
    (el.querySelector('[data-testid="add-section"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelectorAll('[data-testid="domanda"]').length).toBe(1);
  });
});
