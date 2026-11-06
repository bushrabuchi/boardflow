import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';

import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { TIME_PATTERN, validMeetingTimeRange } from '../validators/meeting-time.validator';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MOCK_MEMBERS } from '../data-access/member.mock';
import { MeetingStore } from '../data-access/meeting-store';
import { CurrentUserService } from '../../../core/current-user.service';
import { CreateMeetingInput, MeetingStatus, MEETING_STATUSES } from '../models/meeting.model';
const nonBlank: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value.trim().length > 0 ? null : { blank: true };

const todayOrLater: ValidatorFn = (control) => {
  const value = control.value;

  // Validators.required handles an empty value.
  if (value === null) {
    return null;
  }

  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return { invalidDate: true };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selected = new Date(value);
  selected.setHours(0, 0, 0, 0);

  return selected < today ? { pastDate: true } : null;
};

@Component({
  selector: 'app-meeting-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './meeting-form.html',
  styleUrl: './meeting-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeetingForm implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly currentUser = inject(CurrentUserService);
  readonly statusOptions = MEETING_STATUSES;
  readonly editId = signal<number | null>(null);
  readonly loadError = signal('');
  readonly saveError = signal('');
  private readonly store = inject(MeetingStore);
  private readonly router = inject(Router);
  readonly availableMembers = MOCK_MEMBERS;
  readonly submitted = signal(false);
  readonly saved = signal(false);
  readonly creatorName = signal(this.currentUser.user().name);
  private readonly memberNames = new Map(MOCK_MEMBERS.map((member) => [member.id, member.name]));
  readonly minimumDate = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate(),
  );

  readonly committees = [
    'Executive Board',
    'Finance Committee',
    'Audit Committee',
    'Technology Committee',
    'Governance Committee',
  ];

  readonly form = new FormGroup(
    {
      title: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, nonBlank, Validators.maxLength(120)],
      }),

      committee: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      members: new FormControl<string[]>([], {
        nonNullable: true,
        validators: [Validators.required],
      }),

      assigneeId: new FormControl(this.currentUser.user().id, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      status: new FormControl<MeetingStatus>('Draft', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      startTime: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(TIME_PATTERN)],
      }),

      endTime: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(TIME_PATTERN)],
      }),
      date: new FormControl<Date | null>(null, {
        validators: [Validators.required, todayOrLater],
      }),

      agenda: new FormArray<FormControl<string>>(
        [this.createAgendaControl()],
        [Validators.required, Validators.maxLength(20)],
      ),
    },
    {
      validators: [validMeetingTimeRange],
    },
  );
  ngOnInit(): void {
    this.loadMeetingForEditing();
  }

  private loadMeetingForEditing(): void {
    const rawId = this.route.snapshot.paramMap.get('id');

    if (rawId === null) {
      return;
    }

    const id = Number(rawId);

    if (!/^[1-9]\d*$/.test(rawId) || !Number.isSafeInteger(id)) {
      this.loadError.set('The meeting ID is invalid.');
      return;
    }

    const meeting = this.store.meetings().find((item) => item.id === id);

    if (!meeting) {
      this.loadError.set('This meeting could not be found.');
      return;
    }

    if (!this.store.canEdit(meeting)) {
      this.loadError.set(
        'You cannot edit this meeting with your current permissions or lifecycle.',
      );
      return;
    }

    this.editId.set(meeting.id);

    const [year, month, day] = meeting.date.split('-').map(Number);
    this.creatorName.set(this.memberNames.get(meeting.createdById ?? '') ?? 'Not recorded');
    this.form.patchValue({
      title: meeting.title,
      committee: meeting.committee,
      date: new Date(year, month - 1, day),
      startTime: meeting.startTime ?? '',
      endTime: meeting.endTime ?? '',
      members: [...meeting.members],
      status: meeting.status,
      assigneeId: meeting.assigneeId ?? this.currentUser.user().id,
    });

    this.agenda.clear();

    const agendaItems = meeting.agenda?.length ? meeting.agenda : [''];

    for (const title of agendaItems) {
      const control = this.createAgendaControl();
      control.setValue(title);
      this.agenda.push(control);
    }

    this.form.markAsPristine();
  }
  get agenda(): FormArray<FormControl<string>> {
    return this.form.controls.agenda;
  }

  addAgendaItem(): void {
    if (this.agenda.length >= 20) {
      return;
    }

    this.agenda.push(this.createAgendaControl());
    this.form.markAsDirty();
  }

  removeAgendaItem(index: number): void {
    if (this.agenda.length <= 1) {
      return;
    }

    this.agenda.removeAt(index);
    this.form.markAsDirty();
  }

  save(): void {
    if (this.saved() || this.loadError()) {
      return;
    }

    this.submitted.set(true);
    this.saveError.set('');

    this.form.controls.date.updateValueAndValidity();
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();

    if (!value.date) {
      return;
    }

    const input: CreateMeetingInput = {
      title: value.title,
      committee: value.committee,
      date: this.toDateOnly(value.date),
      startTime: value.startTime,
      endTime: value.endTime,
      timeZone: 'Asia/Riyadh',
      agenda: value.agenda,
      members: value.members,
      status: value.status,
      assigneeId: value.assigneeId,
    };

    const id = this.editId();

    const meeting = id === null ? this.store.create(input) : this.store.update(id, input);

    if (!meeting) {
      this.saveError.set('This meeting is no longer editable. Your changes have not been saved.');
      return;
    }

    this.saved.set(true);
    this.form.markAsPristine();

    void this.router.navigate(['/meetings', meeting.id]);
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.saved() && !this.loadError();
  }

  private createAgendaControl(): FormControl<string> {
    return new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, nonBlank, Validators.maxLength(200)],
    });
  }

  private toDateOnly(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
