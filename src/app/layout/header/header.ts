import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';

import { ThemeService } from '../../core/theme.service';

interface AppNotification {
  id: number;
  message: string;
  read: boolean;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, MatBadgeModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  readonly themeService = inject(ThemeService);

  readonly isMobile = input(false);
  readonly navigationOpen = input(false);
  readonly menuToggle = output<void>();

  // Temporary demo identity until authentication is connected.
  readonly user = {
    name: 'Demo Secretary',
    initials: 'DS',
    role: 'Committee Secretary',
  };

  readonly notifications = signal<AppNotification[]>([
    {
      id: 1,
      message: 'Quarterly board agenda is ready for review.',
      read: false,
    },
    {
      id: 2,
      message: 'Annual budget meeting has been updated.',
      read: false,
    },
    {
      id: 3,
      message: 'Risk and compliance agenda was approved.',
      read: true,
    },
  ]);

  readonly unreadCount = computed(() => this.notifications().filter((item) => !item.read).length);

  markAsRead(id: number): void {
    this.notifications.update((items) =>
      items.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  }

  markAllAsRead(): void {
    this.notifications.update((items) => items.map((item) => ({ ...item, read: true })));
  }
}
