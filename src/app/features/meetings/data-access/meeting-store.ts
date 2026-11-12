import { Injectable, inject, signal } from '@angular/core';
import { CreateMeetingInput, Meeting } from '../models/meeting.model';
import { CurrentUserService } from '../../../core/current-user.service';
import { MOCK_MEETINGS } from './meeting.mock';
import { canEditMeeting } from './meeting-policy';
import { BrowserStorageService } from '../../../core/browser-storage.service';
import { ActionDataStore } from './action-data-store';
import { isMeetingArray } from './meeting-storage.validators';

@Injectable({
  providedIn: 'root',
})
export class MeetingStore {
  private readonly storage = inject(BrowserStorageService);
  private readonly actionData = inject(ActionDataStore);
  private readonly storageKey = 'boardflow.meetings.v1';
  private readonly meetingState = signal<readonly Meeting[]>(
    this.storage.load(this.storageKey, MOCK_MEETINGS, isMeetingArray),
  );
  private readonly currentUser = inject(CurrentUserService);
  readonly meetings = this.meetingState.asReadonly();
  readonly mutationError = signal('');
  readonly storageError = this.storage.error;

  canEdit(meeting: Meeting): boolean {
    return canEditMeeting(meeting, this.currentUser.user());
  }

  create(input: CreateMeetingInput): Meeting | undefined {
    this.mutationError.set('');

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
      status: input.status,
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

    const meetings = [meeting, ...this.meetingState()];

    if (!this.storage.save(this.storageKey, meetings)) {
      this.mutationError.set(this.storage.error() || 'The meeting could not be saved.');
      return undefined;
    }

    this.meetingState.set(meetings);
    return meeting;
  }

  update(id: number, input: CreateMeetingInput): Meeting | undefined {
    this.mutationError.set('');
    const existing = this.meetingState().find((item) => item.id === id);

    // Check the business rule in the store as well as in the UI.
    if (!existing || !this.canEdit(existing)) {
      return undefined;
    }

    const removedOwnerHasOpenAction = this.actionData.actions().some(
      (action) =>
        action.meetingId === id &&
        action.status !== 'Completed' &&
        existing.members.includes(action.assigneeId) &&
        !input.members.includes(action.assigneeId),
    );

    if (removedOwnerHasOpenAction) {
      this.mutationError.set('Reassign or complete unfinished actions before removing their owners.');
      return undefined;
    }

    const agenda = input.agenda.map((item) => item.trim());

    const updated: Meeting = {
      ...existing,
      title: input.title.trim(),
      committee: input.committee,
      date: input.date,
      agenda,
      status: input.status,
      agendaItems: agenda.length,
      members: [...new Set(input.members)],
      assigneeId: input.assigneeId,
      startTime: input.startTime,
      endTime: input.endTime,
      timeZone: input.timeZone,
    };

    const meetings = this.meetingState().map((item) => (item.id === id ? updated : item));

    if (!this.storage.save(this.storageKey, meetings)) {
      this.mutationError.set(this.storage.error() || 'The meeting could not be saved.');
      return undefined;
    }

    this.meetingState.set(meetings);
    return updated;
  }
}
