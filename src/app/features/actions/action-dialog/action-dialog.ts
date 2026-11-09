import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { MeetingStore } from '../../meetings/data-access/meeting-store';
import { MeetingActionStore } from '../../meetings/data-access/meeting-action-store';
import { MOCK_MEMBERS } from '../../meetings/data-access/member.mock';

export interface ActionDialogData {
  readonly meetingId: number | null;
  readonly lockMeeting: boolean;
}

@Component({
  selector: 'app-action-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './action-dialog.html',
  styleUrl: './action-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionDialog {
  private readonly meetingStore = inject(MeetingStore);
  private readonly actionStore = inject(MeetingActionStore);

  private readonly dialogRef = inject<MatDialogRef<ActionDialog, boolean>>(MatDialogRef);

  private readonly data = inject<ActionDialogData>(MAT_DIALOG_DATA);

  readonly error = signal('');
  readonly meetingLocked = this.data.lockMeeting;

  readonly lockedMeetingTitle = computed(
    () =>
      this.availableMeetings().find((meeting) => meeting.id === this.data.meetingId)?.title ??
      'Meeting unavailable',
  );
  readonly availableMeetings = computed(() =>
    this.meetingStore.meetings().filter((meeting) => this.meetingStore.canEdit(meeting)),
  );

  readonly form = new FormGroup({
    meetingId: new FormControl<number | null>(null, Validators.required),

    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(200)],
    }),

    assigneeId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    dueDate: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  readonly selectedMeetingId = toSignal(this.form.controls.meetingId.valueChanges, {
    initialValue: this.form.controls.meetingId.value,
  });

  readonly participants = computed(() => {
    const meeting = this.availableMeetings().find((item) => item.id === this.selectedMeetingId());

    return MOCK_MEMBERS.filter((member) => meeting?.members.includes(member.id));
  });

  constructor() {
    // Changing the meeting clears the previous assignee.
    this.form.controls.meetingId.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.form.controls.assigneeId.reset('');
      this.error.set('');
    });

    // Use the board's selected meeting when it is editable.
    const initialMeeting = this.availableMeetings().find(
      (meeting) => meeting.id === this.data.meetingId,
    );

    if (initialMeeting) {
      this.form.controls.meetingId.setValue(initialMeeting.id);
    }
  }

  save(): void {
    this.error.set('');
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();

    const meetingId = this.meetingLocked ? this.data.meetingId : value.meetingId;

    if (meetingId === null) {
      this.error.set('Choose a valid meeting.');
      return;
    }

    const error = this.actionStore.create(meetingId, {
      title: value.title.trim(),
      assigneeId: value.assigneeId,
      dueDate: value.dueDate,
    });

    if (error !== null) {
      this.error.set(error);
      return;
    }

    this.dialogRef.close(true);
  }
}
