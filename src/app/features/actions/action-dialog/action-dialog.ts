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

import {
  ACTION_PRIORITIES,
  ActionPriority,
  CreateMeetingActionInput,
  isDateOnly,
} from '../../meetings/models/meeting-action.model';

export interface ActionDialogData {
  readonly meetingId: number | null;
  readonly lockMeeting: boolean;
  readonly actionId?: string;
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

  private readonly originalAction = this.data.actionId
    ? this.actionStore.actions().find((action) => action.id === this.data.actionId)
    : undefined;

  readonly isEditing = this.data.actionId !== undefined;
  readonly meetingLocked = this.isEditing || this.data.lockMeeting;

  private readonly initialMeetingId = this.originalAction?.meetingId ?? this.data.meetingId;

  readonly error = signal('');
  readonly priorities = ACTION_PRIORITIES;

  readonly availableMeetings = computed(() =>
    this.meetingStore.meetings().filter((meeting) => this.actionStore.canCreate(meeting.id)),
  );

  readonly lockedMeetingTitle = computed(
    () =>
      this.meetingStore.meetings().find((meeting) => meeting.id === this.initialMeetingId)?.title ??
      'Meeting unavailable',
  );

  readonly form = new FormGroup({
    meetingId: new FormControl<number | null>(null, Validators.required),

    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(200)],
    }),

    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(2000)],
    }),

    assigneeId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    dueDate: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        (control) => (!control.value || isDateOnly(control.value) ? null : { invalidDate: true }),
      ],
    }),

    priority: new FormControl<ActionPriority>('Medium', {
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
    this.form.controls.meetingId.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.form.controls.assigneeId.reset('');
      this.error.set('');
    });

    if (this.isEditing && !this.originalAction) {
      this.error.set('This action could not be found.');
      this.form.disable();
      return;
    }

    if (this.originalAction && !this.actionStore.canEdit(this.originalAction)) {
      this.error.set('You do not have permission to edit this action.');
      this.form.disable();
      return;
    }

    // Set the meeting first: its subscription clears the assignee.
    this.form.controls.meetingId.setValue(this.initialMeetingId);

    if (this.originalAction) {
      this.form.patchValue({
        title: this.originalAction.title,
        description: this.originalAction.description,
        assigneeId: this.originalAction.assigneeId,
        dueDate: this.originalAction.dueDate,
        priority: this.originalAction.priority,
      });
    }

    this.form.markAsPristine();
  }

  save(): void {
    if (this.form.disabled) {
      return;
    }

    this.error.set('');
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();

    const meetingId = this.meetingLocked ? this.initialMeetingId : value.meetingId;

    if (meetingId === null) {
      this.error.set('Choose a valid meeting.');
      return;
    }

    const input: CreateMeetingActionInput = {
      title: value.title,
      description: value.description,
      assigneeId: value.assigneeId,
      dueDate: value.dueDate,
      priority: value.priority,
    };

    const error = this.originalAction
      ? this.actionStore.update(this.originalAction.id, input)
      : this.actionStore.create(meetingId, input);

    if (error !== null) {
      this.error.set(error);
      return;
    }

    this.dialogRef.close(true);
  }
}
