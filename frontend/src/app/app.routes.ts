import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { InformacionComponent } from './components/informacion/informacion.component';
import { ActividadComponent } from './components/actividad/actividad.component';
import { AuthComponent } from './components/auth/auth.component';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },//Por defecto vamos a HOME
    { path: 'home', component: HomeComponent },
    { path: 'informacion', component: InformacionComponent },
    { path: 'actividad', component: ActividadComponent },
    { path: 'auth', component: AuthComponent }
  ];
  