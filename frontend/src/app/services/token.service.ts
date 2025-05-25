import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';

/**
 * Servicio para gestionar el JSON WEB TOKEN
 */
@Injectable({
  providedIn: 'root'
})
export class TokenService {

  private JWT_TOKEN = "token";
  constructor() { }



  setTokens(tokens: string): void {
    this.setToken(tokens);
  }
  get token(): any {
    return localStorage.getItem(this.JWT_TOKEN);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.JWT_TOKEN, token);
  }


  public decodeToken(): any {
    const token = this.token;
    if (!token) {
      return null;  // o maneja el caso cuando el token no esté presente
    }

    const helper = new JwtHelperService();
    return helper.decodeToken(token).data;
  }



  public getTokenPayload(): any {
    const token = this.token;
    if (!token) {
      return null;  // o maneja el caso cuando el token no esté presente
    }

    const helper = new JwtHelperService();
    return helper.decodeToken(token);
  }

  public jwtTokenExp(): any {
    const token = localStorage.getItem(this.JWT_TOKEN);
    if (!token) {
      return null;  // o maneja el caso cuando el token no esté presente
    }
    const helper = new JwtHelperService();
    return helper.isTokenExpired(token);
  }

  eliminarTokens() {
    localStorage.removeItem(this.JWT_TOKEN);
  }
  
  public tiempoExpToken(): any {
    const token = localStorage.getItem(this.JWT_TOKEN);
    if (!token) {
      return null;  // o maneja el caso cuando el token no esté presente
    }
    const helper = new JwtHelperService();

    return helper.decodeToken(token).exp - (Date.now() / 1000);
  }

}
