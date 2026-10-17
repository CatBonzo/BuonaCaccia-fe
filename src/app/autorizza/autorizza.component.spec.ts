import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AutorizzaComponent } from './autorizza.component';

describe('AutorizzaComponent', () => {
  it('si crea', async () => {
    await TestBed.configureTestingModule({
      imports: [AutorizzaComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const fixture = TestBed.createComponent(AutorizzaComponent);
    fixture.componentRef.setInput('token', 'tok');
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
