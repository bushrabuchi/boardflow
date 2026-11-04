import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MeetingStore } from '../meetings/data-access/meeting-store';
import { MeetingStatus } from '../meetings/models/meeting.model';
import { MOCK_MEMBERS } from '../meetings/data-access/member.mock';
// type MeetingStatus = 'Draft' | 'In review' | 'Approved';

interface MeetingCard {
  id: number;
  title: string;
  committee: string;
  status: MeetingStatus;
  date: string;
  agendaItems: number;
  completedActions: number;
  totalActions: number;
  members: string[];
  accent: 'purple' | 'blue' | 'rose';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly meetingStore = inject(MeetingStore);
  readonly meetings = this.meetingStore.meetings;
  readonly searchControl = new FormControl('', {
    nonNullable: true,
  });

  readonly statusControl = new FormControl<MeetingStatus | 'All'>('All', { nonNullable: true });

  private readonly search = toSignal(this.searchControl.valueChanges, {
    initialValue: this.searchControl.value,
  });

  private readonly status = toSignal(this.statusControl.valueChanges, {
    initialValue: this.statusControl.value,
  });

  readonly filteredMeetings = computed(() => {
    const query = this.search().trim().toLowerCase();
    const selectedStatus = this.status();

    return this.meetings().filter((meeting) => {
      const matchesSearch = `${meeting.title} ${meeting.committee}`.toLowerCase().includes(query);

      const matchesStatus = selectedStatus === 'All' || meeting.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  });
}
