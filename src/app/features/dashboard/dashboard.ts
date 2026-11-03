import { Component, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

type MeetingStatus = 'Draft' | 'In review' | 'Approved';

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

  readonly meetings = signal<MeetingCard[]>([
    {
      id: 1,
      title: 'Quarterly board review',
      committee: 'Executive Board',
      status: 'In review',
      date: '2026-11-12',
      agendaItems: 8,
      completedActions: 4,
      totalActions: 6,
      members: ['SA', 'NM', 'AK'],
      accent: 'purple',
    },
    {
      id: 2,
      title: 'Annual budget planning',
      committee: 'Finance Committee',
      status: 'Draft',
      date: '2026-11-15',
      agendaItems: 6,
      completedActions: 2,
      totalActions: 5,
      members: ['FA', 'RH', 'MS'],
      accent: 'blue',
    },
    {
      id: 3,
      title: 'Risk and compliance',
      committee: 'Audit Committee',
      status: 'Approved',
      date: '2026-11-18',
      agendaItems: 5,
      completedActions: 7,
      totalActions: 7,
      members: ['LA', 'SA', 'HK'],
      accent: 'rose',
    },
    {
      id: 4,
      title: 'Digital transformation',
      committee: 'Technology Committee',
      status: 'In review',
      date: '2026-11-20',
      agendaItems: 7,
      completedActions: 3,
      totalActions: 8,
      members: ['OM', 'NA', 'FA'],
      accent: 'blue',
    },
    {
      id: 5,
      title: 'Policy review workshop',
      committee: 'Governance Committee',
      status: 'Draft',
      date: '2026-11-23',
      agendaItems: 4,
      completedActions: 1,
      totalActions: 4,
      members: ['NM', 'AK'],
      accent: 'purple',
    },
    {
      id: 6,
      title: 'Strategic priorities',
      committee: 'Executive Board',
      status: 'Approved',
      date: '2026-11-26',
      agendaItems: 9,
      completedActions: 5,
      totalActions: 6,
      members: ['SA', 'RH', 'LA'],
      accent: 'rose',
    },
  ]);

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
