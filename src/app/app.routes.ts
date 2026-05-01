import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'client-services',
        loadComponent: () =>
          import('./features/client-services/client-services.component').then(
            (m) => m.ClientServicesComponent,
          ),
      },
      {
        path: 'client-services/:id',
        loadComponent: () =>
          import(
            './features/client-services/client-service-detail/client-service-detail.component'
          ).then((m) => m.ClientServiceDetailComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/users.component').then((m) => m.UsersComponent),
      },
    ],
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];

