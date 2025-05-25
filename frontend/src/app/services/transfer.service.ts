import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

const _SERVER = environment.servidor;


@Injectable({
  providedIn: 'root'
})

/**
 * 
 * Servicio para manejar las transferencias
 * 
 *  */
export class TransferService {
  private readonly http = inject(HttpClient);
  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'Application/json'
    })
  };
  constructor() { }

/**
 * 
 * @param limit ultimo registro de transferencia
 * @param start inicio de la transferencias a visualizar
 * @param sender id o usuario de las transferencias a obtener
 * @returns Transferencias obtenidads por el idUser
 */
  getTransfers(limit: number, start: number, sender: number): Observable<any> {
    return this.http.get<any>(`${_SERVER}/transfer?limit=${limit}&start=${start}&idUser=${sender}`);
  }

  /**
   * 
   * @param receiverPhoneNumber Numero del usuario
   * @returns Estado de la cuenta, activa o inactiva
   */
  verifyUser(receiverPhoneNumber: string): Observable<any> {
    return this.http.get<any>(`${_SERVER}/user/${receiverPhoneNumber}`);
  }

/**
 * 
 *Servicio para realizar transferencias

 * @param data Recibe los datos para la transferencia
 * @returns Informacion o comprobante de la transferencia con la referencia
 */
  transfer(data: {
    sender: string;
    receiver: string;
    amount: number;
    details: string;
  }): Observable<any> {
    return this.http.post<any>(`${_SERVER}/account/make-transfer`, data);
  }

}
