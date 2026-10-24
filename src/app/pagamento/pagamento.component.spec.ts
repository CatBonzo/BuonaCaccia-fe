import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PagamentoComponent } from './pagamento.component';

describe('PagamentoComponent', () => {
  it('si crea', async () => {
    await TestBed.configureTestingModule({
      imports: [PagamentoComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const fixture = TestBed.createComponent(PagamentoComponent);
    fixture.componentRef.setInput('id', 'i1');
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
