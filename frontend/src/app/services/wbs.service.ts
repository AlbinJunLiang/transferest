import { Injectable } from '@angular/core';
import { environment } from '../../environments/socketEnvironment';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WbsService {
  private WS_ENDPOINT = environment.servidor;
  private socket!: WebSocket;
  private messages$ = new Subject<any>();

  connect(): Observable<any> {
    if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
      this.socket = new WebSocket(this.WS_ENDPOINT);

      this.socket.onopen = () => {
      };

      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.messages$.next(data);
      };

      this.socket.onerror = (event) => {
      };

      this.socket.onclose = () => {
      };
    }
    return this.messages$.asObservable();
  }

  /**
   * 
   * @returns evuelve una promesa que se resuelve únicamente cuando el WebSocket 
   * ya está listo para enviar y recibir datos.
   */
  waitForConnection(): Promise<void> {
    return new Promise((resolve) => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        resolve();
      } else {
        this.socket.onopen = () => {
          resolve();
        };
      }
    });
  }

  send(data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
    }
  }

  close() {
    if (this.socket) {
      this.socket.close();
    }
  }
}
