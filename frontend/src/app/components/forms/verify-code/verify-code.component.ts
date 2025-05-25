import { Component, Inject, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../../services/auth.service';
import { RegisterComponent } from '../register/register.component';
import { interval, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../../services/account.service';
import { MessageComponent } from '../message/message.component';

/**
 * Componente para verificar la cuenta por medio de un codigo
 */
@Component({
  selector: 'app-verify-code',
  standalone: true,
  imports: [MatDialogModule, ReactiveFormsModule, MatFormFieldModule,
    MatButtonModule, MatInputModule, MatIconModule, CommonModule],
  templateUrl: './verify-code.component.html',
  styleUrl: './verify-code.component.scss'
})
export class VerifyCodeComponent implements OnInit, OnDestroy {

  frmVerify: FormGroup;
  private builder = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  readonly dialogoRef = inject(MatDialogRef<RegisterComponent>);
  tiempoRestante: number = 259;
  private subscription!: Subscription;
  private authService = inject(AuthService);
  private accountService = inject(AccountService);
  mensaje: string = 'Esperando código...';
  success: boolean = false;
    click = false;
  error = '';


  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.frmVerify = this.builder.group({
      verificationCode: [null, [Validators.pattern('^[0-9]+$'), Validators.required, Validators.maxLength(6)]],
    });
    this.tiempoRestante = data.expirationTime;

  }

  get F() {
    return this.frmVerify.controls;
  }

    onInputClick() {
    this.click = false;
  }

  reenviarCodigo(): void {

    let request$;
    if (this.data.ACTION === 'RECOVER_ACCOUNT') {
      const email = this.data.formData.email;

      request$ = this.authService.recoverAccount(email);
    } else if (this.data.ACTION === 'VERIFY_ACCOUNT') {
      request$ = this.authService.requestConfirm(this.authService.getUserActual().email);
    } else {
      return; // Si no hay acción válida, salir de la función
    }

    request$.subscribe({
      next: () => {
        if (this.subscription) {
          this.subscription.unsubscribe();
        }

        this.tiempoRestante = this.data.expirationTime;
        this.mensaje = 'Esperando código...';

        const nuevoContador = interval(1000);
        this.subscription = nuevoContador.subscribe(() => {
          if (this.tiempoRestante > 0) {
            this.tiempoRestante--;
          } else {
            this.subscription.unsubscribe();
          }
        });
      },
      error: (err) => {
             this.click = true;
          this.error = "Código invalido";
      }
    });
  }




  ngOnInit(): void {
    const contador = interval(1000); // cada 1 segundo

    this.subscription = contador.subscribe(() => {
      if (this.tiempoRestante > 0) {
        this.tiempoRestante--;
      } else {
        this.subscription.unsubscribe();
        this.mensaje = 'Reenviar nuevo código';
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }


  openMessageDialog(title: string, content:string): void {
    this.dialog.open(MessageComponent, {
      width: '400px', // Ancho del diálogo
      data: { title: title, content:content, showCancelButton: false },
    });

  }



  onVerify() {
    this.authService.verifyAccount(this.frmVerify.value).subscribe({
      next: (res) => {
        // Aquí puedes manejar la respuesta exitosa
        this.dialogoRef.close(); // Cierra el diálogo en caso de éxito
        this.openMessageDialog( 'Cuenta verificada ✅', 'Ya puedes realizar trasnferencias');

        this.accountService.setEstatus(true);

      },
      error: (err) => {
           this.click = true;
          this.error = "Código invalido";
      }
    });
  }




  onRecoverAccount() {
    if (this.data.ACTION === 'RECOVER_ACCOUNT') {

      const payload = {
        email: this.data.formData.email,
        newPassword: this.data.formData.confirmPassword,
        verificationCode: this.frmVerify.value.verificationCode
      };


      this.authService.resetPassword(payload).subscribe({
        next: (res) => {
          // Aquí puedes manejar la respuesta exitosa
          this.dialogoRef.close(); // Cierra el diálogo en caso de éxito
        this.openMessageDialog('Cuenta recuperada ✅', 'Vuelva a iniciar sesión');
        },
        error: (err) => {
           this.click = true;
          this.error = "Código invalido";
        }
      });
    }
  }
} //FIN
