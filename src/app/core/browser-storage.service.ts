import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BrowserStorageService {
  private readonly errorState = signal('');
  private readonly blockedKeys = new Set<string>();

  readonly error = this.errorState.asReadonly();

  load<T>(key: string, fallback: T, isValid: (value: unknown) => value is T): T {
    try {
      const raw = localStorage.getItem(key);

      // First visit: save the initial data.
      if (raw === null) {
        localStorage.setItem(key, JSON.stringify(fallback));
        return fallback;
      }

      const parsed: unknown = JSON.parse(raw);

      if (!isValid(parsed)) {
        throw new Error('Invalid stored data');
      }

      return parsed;
    } catch {
      // Protect unreadable data from being overwritten.
      this.blockedKeys.add(key);

      this.errorState.set('Saved data could not be loaded. Saving is paused to protect it.');

      return fallback;
    }
  }

  save<T>(key: string, value: T): boolean {
    if (this.blockedKeys.has(key)) {
      this.errorState.set('Saving is paused because existing browser data could not be loaded.');

      return false;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
      this.errorState.set('');
      return true;
    } catch {
      this.errorState.set('Could not save in this browser. Storage may be full or unavailable.');

      return false;
    }
  }
}
