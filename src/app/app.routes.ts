import { Routes } from '@angular/router';
import { Shell } from './layout/shell/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        title: 'Dashboard | BoardFlow',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((component) => component.Dashboard),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
