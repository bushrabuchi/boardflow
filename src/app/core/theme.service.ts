import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'boardflow-theme';

  private readonly currentTheme = signal<Theme>('light');

  readonly theme = this.currentTheme.asReadonly();

  constructor() {
    let initialTheme: Theme = 'light';

    try {
      const savedTheme = this.document.defaultView?.localStorage.getItem(this.storageKey);

      if (savedTheme === 'light' || savedTheme === 'dark') {
        initialTheme = savedTheme;
      }
    } catch {
      // The theme still works when browser storage is unavailable.
    }

    this.applyTheme(initialTheme);
  }

  toggle(): void {
    const nextTheme = this.currentTheme() === 'light' ? 'dark' : 'light';

    this.applyTheme(nextTheme);

    try {
      this.document.defaultView?.localStorage.setItem(this.storageKey, nextTheme);
    } catch {
      // Saving the preference is optional.
    }
  }

  private applyTheme(theme: Theme): void {
    this.currentTheme.set(theme);
    this.document.documentElement.setAttribute('data-theme', theme);
  }
}
