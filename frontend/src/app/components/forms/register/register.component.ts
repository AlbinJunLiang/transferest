import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthComponent } from '../../auth/auth.component';
import { AuthService } from '../../../services/auth.service';
import { VerifyCodeComponent } from '../verify-code/verify-code.component';
import { CommonModule } from '@angular/common';

import { passwordMatchValidator } from '../../../validators/password-match';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [MatDialogModule, ReactiveFormsModule, MatFormFieldModule,
    MatButtonModule, MatInputModule, MatIconModule, AuthComponent, CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  frmRegister: FormGroup;
  private builder = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private authService = inject(AuthService);
  readonly dialogoRef = inject(MatDialogRef<RegisterComponent>);

  passwordVisibility = {
    password: true,
    confirmPassword: true
  };

  click = false;
  error = '';


  constructor() {
    this.frmRegister = this.builder.group({
      email: ['', [Validators.required, Validators.email]],
      name: ['', [Validators.required, Validators.maxLength(100)]],
      middleName: ['', [Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      firstSurname: ['', [Validators.required, Validators.maxLength(100)]],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$'), Validators.maxLength(12)]],
      password: ['', [Validators.required, Validators.maxLength(100)]],
      confirmPassword: ['', [Validators.required, Validators.maxLength(100)]],
    }, { validators: passwordMatchValidator() });
  }
  get F() {
    return this.frmRegister.controls;
  }

  toggleVisibility(field: 'password' | 'confirmPassword') {
    this.passwordVisibility[field] = !this.passwordVisibility[field];
  }

  openLoginDialog() {
    this.dialogoRef.close(); // Cierra el diálogo en caso de éxito
    this.dialog.open(AuthComponent);
  }

  openVerifyDialog() {
    this.dialog.open(VerifyCodeComponent, {
      disableClose: true, // evita cierre al hacer clic fuera
      data: {
        dialogTitle: 'Check your email',
        expirationTime: 259,
        ACTION: 'VERIFY_ACCOUNT'

      }
    });
  }

  onInputClick() {
    this.click = false;
  }

  /**
   * Registra un usuario nuevo sin la cuenta activada
   */
  onRegister() {

    const { comfirmPassword, ...userWithoutConfirm } = this.frmRegister.value;

    this.authService.register(userWithoutConfirm).subscribe({
      next: (res) => {
        this.dialogoRef.close(); // Cierra el diálogo en caso de éxito
        this.openVerifyDialog();
      },
      error: (err) => {
        // Mostrar error si las credenciales son incorrectas
        this.click = true;
        this.error = err.error.error;
      }
    });
  }
}
