import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AmministrazioneSchedaComponent } from './amministrazione-scheda.component';

describe('AmministrazioneSchedaComponent', () => {
  it('si crea', async () => {
    await TestBed.configureTestingModule({
      imports: [AmministrazioneSchedaComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const fixture = TestBed.createComponent(AmministrazioneSchedaComponent);
    fixture.componentRef.setInput('code', 'ROSS');
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
