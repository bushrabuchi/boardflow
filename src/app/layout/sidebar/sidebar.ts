import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatButtonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  readonly isMobile = input(false);

  readonly navigationSelected = output<void>();
  readonly closeRequested = output<void>();

  readonly navigation = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      path: '/dashboard',
    },
  ];
}
