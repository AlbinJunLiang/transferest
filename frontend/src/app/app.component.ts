import { Component, computed, inject, Output, signal, ViewChild, EventEmitter } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { SideNavComponent } from './components/side-nav/side-nav.component';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { AuthComponent } from './components/auth/auth.component';
import { AuthService } from './services/auth.service';
import { Observable, Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './components/forms/login/login.component';
import { RegisterComponent } from './components/forms/register/register.component';
import { VerifyCodeComponent } from './components/forms/verify-code/verify-code.component';
import { SetPasswordComponent } from './components/forms/set-password/set-password.component';
import { AccountService } from './services/account.service';
import { TransferComponent } from './components/forms/transfer/transfer.component';
import { MatCardModule } from '@angular/material/card';
import { MessageComponent } from './components/forms/message/message.component';
import { InformacionComponent } from './components/informacion/informacion.component';
import { CounterAnimationComponent } from './components/counter-animation/counter-animation.component';
import { WbsService } from './services/wbs.service';
import { TokenService } from './services/token.service';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatToolbarModule, MatButtonModule,
    MatIconModule, MatSidenavModule, SideNavComponent, MatCardModule,
    MatMenuModule, MatMenuTrigger, RouterLink, AuthComponent,
    CommonModule, LoginComponent, RegisterComponent, SetPasswordComponent,
    InformacionComponent, CounterAnimationComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  @ViewChild(CounterAnimationComponent) counterComponent!: CounterAnimationComponent;

  private readonly dialog = inject(MatDialog);
  authService = inject(AuthService);
  tokenService = inject(TokenService);

  accountService = inject(AccountService);
  webSocketService = inject(WbsService);

  @Output() animationFinished = new EventEmitter<number>();


  mensajes: string[] = [];
  private destroy$ = new Subject<void>();
  collapsed = signal(true);
  sidenavWidth = computed(() => this.collapsed() ? '65px' : '250px');
  isLogged$!: Observable<boolean>; // Para guardar el estado de si esta logueado y usarlo posteriormente en validacines
  activeAccount = false;

/**
 * Abre la ventana de verificacion de cuenta
 */
  openVerifyDialog() {
    this.authService.requestConfirm(this.authService.getUserActual().email).subscribe({
      next: (res) => {
        this.dialog.open(VerifyCodeComponent, {
          disableClose: true,
          data: {
            dialogTitle: 'Verify account',
            expirationTime: 259,
            ACTION: 'VERIFY_ACCOUNT'
          }
        });
      },
      error: (err) => {

      }
    });
  }


/**
 * Abre la ventana de inicio de sesion
 */
  openLoginDialog() {
    if (this.authService.isLogged() === true) {
    } else {
      this.dialog.open(AuthComponent);
    }
  }




  openTransferDialog() {
    if (this.authService.isLogged()) {
      this.accountService.isActive$.subscribe(valor => {
        this.activeAccount = valor;
        if (this.activeAccount) {
          const dialogRef = this.dialog.open(TransferComponent);

          // Suscripción al evento del componente hijo
          const sub = dialogRef.componentInstance.animationFinished.subscribe((data) => {
            this.notificar(String(this.authService.getUserActual().userId),
              data.receiver, parseFloat(data.amount), data.references);
            // Actualizar el contador
            if (this.counterComponent) {
              this.counterComponent.animateChange(-data.amount);
            }

            // Importante: desuscribirse para evitar memory leaks
            sub.unsubscribe();
          });

          // Manejar cierre del diálogo
          dialogRef.afterClosed().subscribe(() => {
            sub.unsubscribe(); // Limpieza adicional
          });
        } else {
          this.openMessageDialog();
        }
      });
    } else {
      this.dialog.open(AuthComponent);
    }
  }

  /**
   * Ventana para mensajes de avisos
   */
  openMessageDialog(): void {
    this.dialog.open(MessageComponent, {
      width: '400px', // Ancho del diálogo
      data: {
        title: 'Cuenta sin verificar',
        content: 'Puedes verificar tu cuenta en el menú de autenticación',
        showCancelButton: false
      },
    });
  }

/**
 * Abre la ventana para cambiar la contraseña
 */

  public openChangeDialog() {
    this.dialog.open(SetPasswordComponent, {
      data: {
        dialogTitle: 'Change password',
        ACTION: 'CHANGE_PASSWORD'
      }
    });
  }

/**
 * Abre la ventana o modal de registro
 */

  public openRegisterDialog() {
    this.dialog.open(RegisterComponent);
  }

  logout() {
    this.authService.doLogout();
    this.isLogged$ = this.authService.isLogged$;
  }


  /**
   * Actualiza el estado de logueo si esta o no
   * Inicia la conexion del websocket
   */
  ngOnInit(): void {
    this.isLogged$ = this.authService.isLogged$;
    this.isLogged$.subscribe((isLogged) => {
      if (isLogged) {
        this.accountService.checkAccountStatus(this.authService.getUserActual().userId)
          .pipe(takeUntil(this.destroy$))
          .subscribe((res) => {
            if (res.success) {
              this.activeAccount = res.success;
              this.accountService.setEstatus(true)
            } else {
              this.accountService.setEstatus(false)
            }
          });
      }
    });
    this.initWebSocket();
    this.suscribirWebSocket();
  }


  /**
   * Para iniciar la conexion con el servidor de websocket
   */
  initWebSocket() {
    this.webSocketService.connect().subscribe({
      next: (data) => {
        try {
          if (!data || typeof data !== 'object' || !('type' in data)) {
            throw new Error('Formato de mensaje no válido');
          }

          switch (data.type) {
            case 'error':
              break;

            case 'transfer':
              this.mensajes.push(`Recibiste ${data.amount} de ${data.from}`);
              if (this.counterComponent) {
                this.counterComponent.animateChange(data.amount);
              } else {
              }
              break;

            case 'ack':
              this.mensajes.push(`Confirmación: ${data.message}`);
              break;

            default:
          }

        } catch (err) {
        }
      },
      error: (err) => console.error('Error WebSocket:', err),
      complete: () => console.log('Conexión WebSocket cerrada'),
    });
  }


/**
 * Envia el mensaje o notificacion
 *  al beneficiario de la transferencia
 * 
 * @param senderId 
 * @param recipientId 
 * @param amount 
 * @param referenceCode 
 */
  async notificar(senderId: string, recipientId: string, amount: number, referenceCode: string) {
    try {
      await this.webSocketService.waitForConnection();
      this.webSocketService.send({
        type: 'transfer',
        senderId,
        recipientId,
        amount,
        referenceCode,
        token: this.tokenService.token

      });

    } catch (error) {
    }
  }


/**
 * Registra al usuario en el servidor 
 * del websocket
 */

  async suscribirWebSocket(): Promise<void> {
    try {

      await this.webSocketService.waitForConnection();
      this.isLogged$ = this.authService.isLogged$;
      this.isLogged$.subscribe((isLogged) => {
        if (isLogged) {
          this.webSocketService.send({
            type: 'register',
            id: String(this.authService.getUserActual().userId),
            name: this.authService.getUserActual().name,
            token: this.tokenService.token
          });
        }

      });

    } catch (error) {
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.webSocketService.close();
    this.mensajes = [];
  }

  /**
   * Activador de la animacion de actualizacion de saldo
   */
  triggerCounter() {
    this.counterComponent.animateChange(50); // Llama directamente a la función
  }
}// Fin del componente








