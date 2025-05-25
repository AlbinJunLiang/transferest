import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { MatListModule } from '@angular/material/list'
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { User } from '../../helpers/models/user';
import { AuthService } from '../../services/auth.service';
/**
 * Componente para mostrar la barra lateral izquieda
 */
@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, RouterModule],
  templateUrl: './side-nav.component.html',
  styleUrl: './side-nav.component.scss'
})
export class SideNavComponent implements OnInit {
  sideNavCollapsed = signal(false);
  usuario$!: Observable<User>;

  usuario: string = '';
  authService = inject(AuthService);

  @Input() set collapsed(val: boolean) {
    this.sideNavCollapsed.set(val);
  }

  ngOnInit(): void {
    this.usuario$ = this.authService.actualUser;
  
    this.usuario$.subscribe(usuario => {
      const isEmpty =
        usuario.userId === 0 &&
        usuario.name === '' &&
        usuario.email === '' &&
        usuario.rol === -1;
  
      if (!isEmpty) {
        this.usuario = `${usuario.name} ${usuario.middleName} ${usuario.lastName} ${usuario.firstSurname}`;
      } else {
        this.usuario = this.authService.getUserActual().name + " " +
        this.authService.getUserActual().middleName + " " +
        this.authService.getUserActual().lastName + " " +
        this.authService.getUserActual().firstSurname;      }
    });
  }
  
}
