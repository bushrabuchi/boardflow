import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { map } from 'rxjs';

import { ConfirmLeaveDialog } from '../shared/confirm-leave-dialog';

export interface UnsavedChangesAware {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<UnsavedChangesAware> = (component) => {
  if (!component.hasUnsavedChanges()) {
    return true;
  }

  return inject(MatDialog)
    .open(ConfirmLeaveDialog, {
      width: '420px',
      maxWidth: 'calc(100vw - 32px)',
      ariaLabelledBy: 'leave-dialog-title',
      autoFocus: 'first-tabbable',
    })
    .afterClosed()
    .pipe(map((result) => result === true));
};
