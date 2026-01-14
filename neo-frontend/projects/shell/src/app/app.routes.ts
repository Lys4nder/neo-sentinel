import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../../../dashboard/src/app/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'telemetry',
    loadComponent: () => import('../../../dashboard/src/app/telemetry.component').then(m => m.TelemetryComponent)
  },
  {
    path: 'hazards',
    loadComponent: () => import('../../../dashboard/src/app/hazard.component').then(m => m.HazardComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
