import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { map } from 'rxjs';

import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, MatSidenavModule, Header, Sidebar],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  private readonly breakpoints = inject(BreakpointObserver);

  readonly isMobile = toSignal(
    this.breakpoints.observe('(max-width: 767px)').pipe(map((result) => result.matches)),
    { initialValue: false },
  );
}
