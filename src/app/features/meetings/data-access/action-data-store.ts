import { Injectable, inject, signal } from '@angular/core';

import { BrowserStorageService } from '../../../core/browser-storage.service';

import { MeetingAction, StoredMeetingAction } from '../models/meeting-action.model';

import { isStoredActionArray } from './meeting-storage.validators';

@Injectable({ providedIn: 'root' })
export class ActionDataStore {
  private readonly storage = inject(BrowserStorageService);

  // Preserve the existing key to retain previously saved actions.
  private readonly storageKey = 'boardflow.actions.v1';

  private readonly actionState = signal<readonly MeetingAction[]>(this.loadActions());

  readonly actions = this.actionState.asReadonly();
  readonly storageError = this.storage.error;

  private loadActions(): readonly MeetingAction[] {
    const stored = this.storage.load<readonly StoredMeetingAction[]>(
      this.storageKey,
      [],
      isStoredActionArray,
    );

    const migrated: MeetingAction[] = stored.map((action) => ({
      ...action,
      description: action.description ?? '',
      priority: action.priority ?? 'Medium',
      updatedAt: action.updatedAt ?? action.createdAt,
    }));

    const requiresMigration = stored.some(
      (action) =>
        action.description === undefined ||
        action.priority === undefined ||
        action.updatedAt === undefined,
    );

    if (requiresMigration) {
      // If saving fails, BrowserStorageService exposes the error.
      // The original stored data remains available for a later retry.
      this.storage.save(this.storageKey, migrated);
    }

    return migrated;
  }

  save(actions: readonly MeetingAction[]): string | null {
    if (!this.storage.save(this.storageKey, actions)) {
      return this.storage.error() || 'Actions could not be saved.';
    }

    // Update the UI only after persistence succeeds.
    this.actionState.set(actions);

    return null;
  }
}
