import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CurrentUserService {
  private readonly userState = signal({
    id: 'NM',
    name: 'Nora Mohammed',
    initials: 'NM',
    role: 'Secretary',
    isDemo: true,
  });

  readonly user = this.userState.asReadonly();
}
