import { Component} from '@angular/core';
import {MatDialogModule } from '@angular/material/dialog';
import { LoginComponent } from '../forms/login/login.component';
/**
 * Componenta para mostrar el login
 */
@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [MatDialogModule,LoginComponent],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})
export class AuthComponent {
}