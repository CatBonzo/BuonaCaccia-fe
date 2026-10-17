import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SegreteriaCoordinateComponent } from './segreteria-coordinate.component';

describe('SegreteriaCoordinateComponent', () => {
  it('si crea', async () => {
    await TestBed.configureTestingModule({
      imports: [SegreteriaCoordinateComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const fixture = TestBed.createComponent(SegreteriaCoordinateComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
