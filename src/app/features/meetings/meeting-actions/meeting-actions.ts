import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { MOCK_MEMBERS } from '../data-access/member.mock';
import { MeetingActionStore } from '../data-access/meeting-action-store';
import { ACTION_STATUSES, ActionStatus } from '../models/meeting-action.model';
import { Meeting } from '../models/meeting.model';
import { FormGroupDirective } from '@angular/forms';
@Component({
  selector: 'app-meeting-actions',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './meeting-actions.html',
  styleUrl: './meeting-actions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeetingActions {
  readonly meeting = input.required<Meeting>();

  readonly store = inject(MeetingActionStore);
  readonly statuses = ACTION_STATUSES;

  readonly error = signal('');
  readonly message = signal('');

  private readonly memberNames = new Map(MOCK_MEMBERS.map((member) => [member.id, member.name]));

  readonly participants = computed(() =>
    MOCK_MEMBERS.filter((member) => this.meeting().members.includes(member.id)),
  );

  readonly actions = computed(() =>
    this.store.actions().filter((action) => action.meetingId === this.meeting().id),
  );

  readonly completedCount = computed(
    () => this.actions().filter((action) => action.status === 'Completed').length,
  );

  readonly canCreate = computed(() => this.store.canCreate(this.meeting().id));

  readonly form = new FormGroup({
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

  memberName(id: string): string {
    return this.memberNames.get(id) ?? 'Unknown member';
  }

  addAction(formDirective: FormGroupDirective): void {
    this.error.set('');
    this.message.set('');

    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const error = this.store.create(this.meeting().id, this.form.getRawValue());

    if (error !== null) {
      this.error.set(error);
      return;
    }

    formDirective.resetForm({
      title: '',
      assigneeId: '',
      dueDate: '',
    });

    this.message.set('Action saved.');
  }

  changeStatus(id: string, status: ActionStatus): void {
    this.error.set('');
    this.message.set('');

    const error = this.store.updateStatus(id, status);

    if (error !== null) {
      this.error.set(error);
      return;
    }

    this.message.set('Action status updated.');
  }
}
