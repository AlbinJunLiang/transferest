import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, retry, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { TokenService } from './token.service';
import { IUser } from '../helpers/models/interfaces';
import { User } from '../helpers/models/user';
const _SERVER = environment.servidor;


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() { }

  private readonly http = inject(HttpClient);
  private tokenService = inject(TokenService);
  private actualUserSubject = new BehaviorSubject<IUser>(new User());
  public actualUser = this.actualUserSubject.asObservable();


  private loggedInSubject = new BehaviorSubject<boolean>(this.isLogged());
  public isLogged$ = this.loggedInSubject.asObservable();


  public get actualUserValue(): User {
    return this.actualUserSubject.value;
  }

  public notifyLoginChange(): void {
    this.loggedInSubject.next(this.isLogged());
  }



  getUserActual(): IUser {
    if (!this.tokenService.token) {
      return new User();
    }

    const decodedToken = this.tokenService.decodeToken();

    return {
      userId: this.tokenService.getTokenPayload()?.sub || 0,
      name: decodedToken?.name || '',
      middleName: decodedToken?.middleName || '',
      lastName: decodedToken?.lastName || '',
      firstSurname: decodedToken?.firstSurname || '',
      email: decodedToken?.email || '',
      rol: decodedToken?.rol || 0
    };
  }


  register(datos: {
    email: string; password: string;
    name: string, middleName: string, lastName: string,
    firstSurname: string, phoneNumber: string
  }): Observable<any> {
    return this.http.post<any>(`${_SERVER}/auth/register`, datos).pipe(
      tap((res) => {
        this.tokenService.setTokens(res.token);
        this.actualUserSubject.next(this.getUserActual());
        this.notifyLoginChange(); 
      })
    );
  }



  login(datos: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${_SERVER}/auth/login`, datos).pipe(
      tap((res) => {
        this.tokenService.setTokens(res.token);
        this.actualUserSubject.next(this.getUserActual());
        this.notifyLoginChange(); // <- notifica cambio
      })
    );
  }



  verifyAccount(datos: { verificationCode: string }): Observable<any> {
    return this.http.patch<any>(`${_SERVER}/auth/confirm`, datos).pipe(
      tap((res) => {
      })
    );
  }




  recoverAccount(email: string): Observable<any> {
    return this.http.post<any>(`${_SERVER}/auth/recover-account`, { email }).pipe(
      tap((res) => {
        // puedes hacer algo con la respuesta aquí si lo necesitas
      })
    );
  }


  requestConfirm(email: string): Observable<any> {
    return this.http.post<any>(`${_SERVER}/auth/request-confirm`, { email }).pipe(
      tap((res) => {
        // puedes hacer algo con la respuesta aquí si lo necesitas
      })
    );
  }

  resetPassword(datos: { email: string; verificationCode: string; newPassword: string }): Observable<any> {
    return this.http.patch<any>(`${_SERVER}/auth/reset-password`, datos).pipe(
      tap((res) => {
      })
    );
  }

  changePassword(datos: { password: string; newPassword: string }): Observable<any> {
    return this.http.patch<any>(`${_SERVER}/auth/change-password`, datos).pipe(
      tap((res) => {
      })
    );
  }


  public isLogged(): boolean {
    return !!this.tokenService.token && !this.tokenService.jwtTokenExp();
  }

  public doLogout() {
    if (this.tokenService.token) {
      this.tokenService.eliminarTokens();
    }
    this.actualUserSubject.next(this.getUserActual());
    this.notifyLoginChange(); // <- notifica cambio
  }


  public logout(status: number) {
    if (status === 401 || status === 403) {
      this.doLogout();
    }

  }






}
