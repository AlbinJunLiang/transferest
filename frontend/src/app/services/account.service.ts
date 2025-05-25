import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { BehaviorSubject, catchError, Observable, of } from 'rxjs';

const _SERVER = environment.servidor;


@Injectable({
    providedIn: 'root'
})

export class AccountService {
    private readonly http = inject(HttpClient);
    httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'Application/json'
        })
    };


    private isActiveSubject = new BehaviorSubject<boolean>(false);
    public isActive$ = this.isActiveSubject.asObservable();

    constructor() { }



    setEstatus(state: boolean) {
        this.isActiveSubject.next(state);
    }

    /**
     * 
     * Para verificar si la cuenta esta activa o no
     * 
     */
    checkAccountStatus(id: number): Observable<any> {
        return this.http.get<any>(`${_SERVER}/account/status/${id}`).pipe(
            catchError((error) => {
                return of({ success: false, error: true });
            })
        );
    }


    getBalance(phoneNumber: string): Observable<any> {
        return this.http.get<any>(`${_SERVER}/account/balance/${phoneNumber}`).pipe(
            catchError((error) => {
                console.error('❌ Error al obtener el balance:', error);
                return of({ success: false, balance: null });
            })
        );
    }



}
