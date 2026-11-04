import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { MeetingStore } from '../data-access/meeting-store';
import { MeetingStatus } from '../models/meeting.model';

@Component({
  selector: 'app-meeting-list',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './meeting-list.html',
  styleUrl: './meeting-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeetingList {
  private readonly store = inject(MeetingStore);

  readonly searchControl = new FormControl('', {
    nonNullable: true,
  });

  readonly statusControl = new FormControl<MeetingStatus | 'All'>('All', {
    nonNullable: true,
  });

  private readonly search = toSignal(this.searchControl.valueChanges, {
    initialValue: this.searchControl.value,
  });

  private readonly status = toSignal(this.statusControl.valueChanges, {
    initialValue: this.statusControl.value,
  });

  readonly filteredMeetings = computed(() => {
    const query = this.search().trim().toLowerCase();
    const status = this.status();

    return this.store.meetings().filter((meeting) => {
      const matchesQuery = `${meeting.title} ${meeting.committee}`.toLowerCase().includes(query);

      const matchesStatus = status === 'All' || meeting.status === status;

      return matchesQuery && matchesStatus;
    });
  });

  clearFilters(): void {
    this.searchControl.setValue('');
    this.statusControl.setValue('All');
  }
}
