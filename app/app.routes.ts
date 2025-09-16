import { Routes } from '@angular/router';
import { authGuard } from './guard/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadChildren: () => import('./modules/home/home.routes').then(m => m.homeRoutes)
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];