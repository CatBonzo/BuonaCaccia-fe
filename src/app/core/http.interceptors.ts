import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { ApiError } from './api-error';
import { SessionService } from './session.service';

/** Aggiunge il Bearer del login mock a ogni chiamata all'API. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(SessionService).token();
  return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
};

/**
 * Trasforma ogni errore in ApiError. 401 con sessione aperta = token scaduto: si torna al login.
 * Gli errori 422 (campo) e 409 (stato) li mostra la pagina accanto al modulo; qui solo i guasti.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const apiError = ApiError.from(error);
      if (apiError.status === 401 && session.loggedIn()) {
        session.logout();
        void router.navigate(['/login']);
        snackBar.open('Sessione scaduta: accedi di nuovo.', 'Chiudi', { duration: 5000 });
      } else if (apiError.status === 0 || apiError.status >= 500) {
        snackBar.open(apiError.message, 'Chiudi', { duration: 6000 });
      }
      return throwError(() => apiError);
    }),
  );
};
