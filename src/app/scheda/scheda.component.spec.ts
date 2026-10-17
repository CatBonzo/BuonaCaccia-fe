import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SchedaComponent } from './scheda.component';

describe('SchedaComponent', () => {
  it('si crea', async () => {
    await TestBed.configureTestingModule({
      imports: [SchedaComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const fixture = TestBed.createComponent(SchedaComponent);
    fixture.componentRef.setInput('id', 'i1');
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
