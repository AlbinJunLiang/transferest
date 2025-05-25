import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';
import { AuthService } from '../services/auth.service';
import { catchError, tap, throwError } from 'rxjs';
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  /**
   * Cada vez que se envía una peticion el interceptor detecta y envía 
   * el token a las solicitudes de manera automatica
   */
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);
  const token = tokenService.token;

  // Clonar la request y agregar el token
  const cloneReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  // Interceptar la respuesta para ver el status
  return next(cloneReq).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        authService.logout(event.status);
      }
    }),
    catchError((error) => {
      /**
       * Si el usuario no esta autorizado o esta prohibido su acceso a un recurso se cierra la sesion
       */
      if (error instanceof HttpErrorResponse) {
        authService.logout(error.status);

      }
      return throwError(() => error);
    })
  );
};