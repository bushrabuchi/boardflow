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
      {
        path: 'meetings',
        title: 'Meetings | BoardFlow',
        loadComponent: () =>
          import('./features/meetings/meeting-list/meeting-list').then(
            (component) => component.MeetingList,
          ),
      },
      {
        path: 'meetings/new',
        title: 'Create meeting | BoardFlow',
        loadComponent: () =>
          import('./features/meetings/meeting-form/meeting-form').then(
            (component) => component.MeetingForm,
          ),
      },
      {
        path: 'meetings/:id',
        title: 'Meeting details | BoardFlow',
        loadComponent: () =>
          import('./features/meetings/meeting-details/meeting-details').then(
            (component) => component.MeetingDetails,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
