import { ChangeDetectionStrategy, Component } from '@angular/core';

import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirm-leave-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title id="leave-dialog-title">Discard unsaved changes?</h2>

    <mat-dialog-content>
      Your latest changes have not been saved. Leaving this page will discard them.
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Keep editing</button>

      <button mat-flat-button [mat-dialog-close]="true">Discard changes</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmLeaveDialog {}
