import { Injectable, inject, signal } from '@angular/core';
import { CreateMeetingInput, Meeting } from '../models/meeting.model';
import { CurrentUserService } from '../../../core/current-user.service';
import { MOCK_MEETINGS } from './meeting.mock';
@Injectable({
  providedIn: 'root',
})
export class MeetingStore {
  private readonly meetingState = signal<readonly Meeting[]>(MOCK_MEETINGS);
  private readonly currentUser = inject(CurrentUserService);
  readonly meetings = this.meetingState.asReadonly();

  create(input: CreateMeetingInput): Meeting {
    // Suitable for this local demo. The backend will assign IDs later.
    const id = Math.max(0, ...this.meetingState().map((meeting) => meeting.id)) + 1;

    const agenda = input.agenda.map((item) => item.trim());
    const meeting: Meeting = {
      id,
      title: input.title.trim(),
      committee: input.committee,
      date: input.date,
      agenda,
      agendaItems: agenda.length,
      status: 'Draft',
      completedActions: 0,
      totalActions: 0,
      createdById: this.currentUser.user().id,
      assigneeId: input.assigneeId,
      members: [...new Set(input.members)],
      startTime: input.startTime,
      endTime: input.endTime,
      timeZone: input.timeZone,
      accent: 'purple',
    };

    this.meetingState.update((meetings) => [meeting, ...meetings]);

    return meeting;
  }
  updateDraft(id: number, input: CreateMeetingInput): Meeting | undefined {
    const existing = this.meetingState().find((item) => item.id === id);

    // Check the business rule in the store as well as in the UI.
    if (!existing || existing.status !== 'Draft') {
      return undefined;
    }

    const agenda = input.agenda.map((item) => item.trim());

    const updated: Meeting = {
      ...existing,
      title: input.title.trim(),
      committee: input.committee,
      date: input.date,
      agenda,
      agendaItems: agenda.length,
      members: [...new Set(input.members)],
      assigneeId: input.assigneeId,
      startTime: input.startTime,
      endTime: input.endTime,
      timeZone: input.timeZone,
    };

    this.meetingState.update((items) => items.map((item) => (item.id === id ? updated : item)));

    return updated;
  }
}
