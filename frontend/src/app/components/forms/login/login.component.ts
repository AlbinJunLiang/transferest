import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../../services/auth.service';
import { RegisterComponent } from '../register/register.component';
import { SetPasswordComponent } from '../set-password/set-password.component';
import { VerifyCodeComponent } from '../verify-code/verify-code.component';
import { CommonModule } from '@angular/common';


/**
 * Componente original del Login
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatDialogModule, ReactiveFormsModule, MatFormFieldModule,
    MatButtonModule, MatInputModule, MatIconModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  frmLogin: FormGroup;
  private builder = inject(FormBuilder);
  private authService = inject(AuthService);
  readonly dialogoRef = inject(MatDialogRef<LoginComponent>);
  private readonly dialog = inject(MatDialog);



  hide = true; // Para iniciar el estado de los formularios de ocultar o mostrar contraseña
  error = '';
  click = false; //Para guardar el estado si se clickio a un input o no

  constructor() {
    this.frmLogin = this.builder.group({
      id: (0),
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  /**
   * Cambio alternando el estado de los inputs de las contraseñas
   */
  toggleVisibility() {
    this.hide = !this.hide;
  }

  /**
   * Obtiene las estructura del formulario
   */
  get F() {
    return this.frmLogin.controls;
  }

  public openRecoveryDialog() {
    this.dialogoRef.close(); // Cierra el diálogo en caso de éxito
    this.dialog.open(SetPasswordComponent, {
      data: {
        dialogTitle: 'Recover account',
        ACTION: 'RECOVER_ACCOUNT',
      }
    });

  }

  /**
   * Resetea el clickeo en los inputs a false
   */
  onInputClick() {
    this.click = false;
  }


  openVerifyDialog() {
    this.dialog.open(VerifyCodeComponent, {
      disableClose: true, // evita cierre al hacer clic fuera
      data: {
        dialogTitle: 'Verify code',
        expirationTime: 259
      }
    });
  }

  openRegisterDialog() {
    this.dialogoRef.close(); // Cierra el diálogo en caso de éxito
    this.dialog.open(RegisterComponent);
  }

  /**
   *Para iniciar el login
   * @returns 
   */
  onLogin() {
    if (this.frmLogin.invalid) {
      this.frmLogin.markAllAsTouched(); // Marcar todos los campos como tocados para activar los errores
      return;
    }

    this.authService.login(this.frmLogin.value).subscribe({
      next: () => this.dialogoRef.close()
      ,
      error: (err) => {
        this.click = true;
        this.error = err?.error?.error || 'Error desconocido al iniciar sesión';
      }
    });
  }
}