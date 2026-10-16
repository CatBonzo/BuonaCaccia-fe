import { TestBed } from '@angular/core/testing';
import { FiltriEventi, FiltriEventiComponent } from './filtri-eventi.component';

describe('FiltriEventiComponent', () => {
  it('"Azzera filtri" porta fuori filtri tutti vuoti', async () => {
    await TestBed.configureTestingModule({ imports: [FiltriEventiComponent] }).compileComponents();
    const fixture = TestBed.createComponent(FiltriEventiComponent);
    let ricevuti: FiltriEventi | undefined;
    fixture.componentInstance.cerca.subscribe((f) => (ricevuti = f));
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelectorAll('button').forEach((b) => {
      if (b.textContent?.includes('Azzera')) b.click();
    });

    expect(ricevuti).toEqual({ q: '', region: '', category: '', availability: '', startFrom: '', startTo: '' });
  });
});
