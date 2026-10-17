import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SegreteriaEventiComponent } from './segreteria-eventi.component';

describe('SegreteriaEventiComponent', () => {
  it('si crea', async () => {
    await TestBed.configureTestingModule({
      imports: [SegreteriaEventiComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const fixture = TestBed.createComponent(SegreteriaEventiComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
