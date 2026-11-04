import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';

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
import { CreateMeetingInput } from '../models/meeting.model';
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
export class MeetingForm {
  private readonly route = inject(ActivatedRoute);
  private readonly currentUser = inject(CurrentUserService);

  readonly editId = signal<number | null>(null);
  readonly loadError = signal('');
  readonly saveError = signal('');
  private readonly store = inject(MeetingStore);
  private readonly router = inject(Router);
  readonly availableMembers = MOCK_MEMBERS;
  readonly submitted = signal(false);
  readonly saved = signal(false);

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

  readonly form = new FormGroup({
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
    date: new FormControl<Date | null>(null, {
      validators: [Validators.required, todayOrLater],
    }),

    agenda: new FormArray<FormControl<string>>(
      [this.createAgendaControl()],
      [Validators.required, Validators.maxLength(20)],
    ),
    assigneeId: new FormControl(this.currentUser.user().id, {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

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
    if (this.saved()) {
      return;
    }

    this.submitted.set(true);

    // Recheck the date if the form has remained open overnight.
    this.form.controls.date.updateValueAndValidity();
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();

    if (!value.date) {
      return;
    }

    const meeting = this.store.create({
      title: value.title,
      committee: value.committee,
      date: this.toDateOnly(value.date),
      agenda: value.agenda,
      members: value.members,
      assigneeId: value.assigneeId,
    });

    this.saved.set(true);
    this.form.markAsPristine();

    void this.router.navigate(['/meetings', meeting.id]);
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
