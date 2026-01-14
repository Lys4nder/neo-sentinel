import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../../../dashboard/src/app/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'telemetry',
    loadComponent: () => import('../../../dashboard/src/app/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'hazards',
    loadComponent: () => import('../../../dashboard/src/app/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
