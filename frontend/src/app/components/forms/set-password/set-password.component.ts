import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthComponent } from '../../auth/auth.component';
import { RegisterComponent } from '../register/register.component';
import { AuthService } from '../../../services/auth.service';
import { VerifyCodeComponent } from '../verify-code/verify-code.component';
import { passwordMatchValidator } from '../../../validators/password-match';
import { CommonModule } from '@angular/common';
import { MessageComponent } from '../message/message.component';


@Component({
  selector: 'app-set-password',
  standalone: true,
  imports: [MatDialogModule, ReactiveFormsModule, MatFormFieldModule,
    MatButtonModule, MatInputModule, MatIconModule, AuthComponent, CommonModule],
  templateUrl: './set-password.component.html',
  styleUrl: './set-password.component.scss'
})
export class SetPasswordComponent {
  frmSetPassword: FormGroup;
  private builder = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  readonly dialogoRef = inject(MatDialogRef<RegisterComponent>);
  private authService = inject(AuthService);

  hide = true; // Initialize hide to true to show password initially

  passwordVisibility = {
    password: true,
    currentPassword: true,
    confirmPassword: true
  };

  click = false;
  error = '';


  constructor(@Inject(MAT_DIALOG_DATA) public data: { dialogTitle: string, ACTION: string }) {

    this.frmSetPassword = this.builder.group({
      email: ['', [Validators.required, Validators.email]],
      currentPassword: ['', [Validators.required, Validators.maxLength(100)]],
      password: ['', [Validators.required, Validators.maxLength(100)]],
      confirmPassword: ['', [Validators.required, Validators.maxLength(100)]],
    }, {
      validators: passwordMatchValidator() // esto está bien ahora
    });

  }
  get F() {
    return this.frmSetPassword.controls;
  }

  toggleVisibility(field: 'password' | 'confirmPassword' | 'currentPassword') {
    this.passwordVisibility[field] = !this.passwordVisibility[field];
  }


  openLoginDialog() {
    this.dialogoRef.close(); // Cierra el diálogo en caso de éxito
    this.dialog.open(AuthComponent);
  }

  openMessageDialog(): void {
    this.dialog.open(MessageComponent, {
      width: '400px', // Ancho del diálogo
      data: { title: 'Cambio de contraseña ✅', content: 'la contraseña se ha actualizado exitosamente', showCancelButton: false },
    });

  }



  onChangePassword() {
    const { currentPassword, confirmPassword, password } = this.frmSetPassword.value;
    if (password === confirmPassword) { //evitar que se omita la comparacion de contraseña antes de ejecutar
      this.authService.changePassword({
        password: currentPassword,              // contraseña actual
        newPassword: confirmPassword  // nueva contraseña
      }).subscribe({
        next: (res) => {
          this.dialogoRef.close(); // Cierra el diálogo en caso de éxito
          this.openMessageDialog();
        },
        error: (err) => {
          this.click = true;
          this.error = err.error.error;
        }
      });
    }
  }


  onInputClick() {
    this.click = false;
  }

  /**
   * Para iniciar el proceso de recuperacion de cuenta
   */
  onRecoveryAccount() {
      const { confirmPassword, password } = this.frmSetPassword.value;
    if (password === confirmPassword) { //evitar que se omita la comparacion de contraseña antes de ejecutar
    this.authService.recoverAccount(this.frmSetPassword.value.email).subscribe({
      next: (res) => {
        this.dialogoRef.close(); // Cierra el diálogo en caso de éxito
        this.dialog.open(VerifyCodeComponent, {
          disableClose: true, // evita cierre al hacer clic fuera
          data: {
            dialogTitle: 'Recover',
            expirationTime: 259,
            formData: this.frmSetPassword.value,
            ACTION: 'RECOVER_ACCOUNT'
          }
        });
      },
      error: (err) => {
        this.click = true;
        this.error = err.error.error;
      }
    });
  }
  }
} // FIN
