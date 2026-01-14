import { bootstrapApplication } from '@angular/platform-browser';
import { DashboardComponent } from './app/dashboard.component';
import { appConfig } from './app/app.config';

bootstrapApplication(DashboardComponent, appConfig)
  .catch(err => console.error(err));
