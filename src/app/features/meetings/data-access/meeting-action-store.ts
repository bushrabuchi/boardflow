import { inject, Injectable, signal } from '@angular/core';

import { CurrentUserService } from '../../../core/current-user.service';
import {
  ACTION_STATUSES,
  ActionStatus,
  CreateMeetingActionInput,
  MeetingAction,
} from '../models/meeting-action.model';
import { MeetingStore } from './meeting-store';

@Injectable({ providedIn: 'root' })
export class MeetingActionStore {
  private readonly meetingStore = inject(MeetingStore);
  private readonly currentUser = inject(CurrentUserService);

  private readonly actionState = signal<readonly MeetingAction[]>([]);

  readonly actions = this.actionState.asReadonly();

  canCreate(meetingId: number): boolean {
    const meeting = this.meetingStore.meetings().find((item) => item.id === meetingId);

    return !!meeting && this.meetingStore.canEdit(meeting);
  }

  canUpdateStatus(action: MeetingAction): boolean {
    return this.canCreate(action.meetingId) || action.assigneeId === this.currentUser.user().id;
  }

  create(meetingId: number, input: CreateMeetingActionInput): string | null {
    const meeting = this.meetingStore.meetings().find((item) => item.id === meetingId);

    if (!meeting || !this.meetingStore.canEdit(meeting)) {
      return 'You do not have permission to add actions to this meeting.';
    }

    // The assigned person must belong to this meeting.
    if (!meeting.members.includes(input.assigneeId)) {
      return 'Choose a participant from this meeting.';
    }

    const action: MeetingAction = {
      id: crypto.randomUUID(),
      meetingId,
      title: input.title.trim(),
      assigneeId: input.assigneeId,
      dueDate: input.dueDate,
      status: 'To do',
      createdById: this.currentUser.user().id,
      createdAt: new Date().toISOString(),
    };

    this.actionState.update((items) => [...items, action]);

    return null;
  }

  updateStatus(id: string, status: ActionStatus): string | null {
    const action = this.actionState().find((item) => item.id === id);

    if (!action) {
      return 'This action could not be found.';
    }

    if (!this.canUpdateStatus(action)) {
      return 'You do not have permission to update this action.';
    }

    if (!ACTION_STATUSES.includes(status)) {
      return 'Choose a valid action status.';
    }

    this.actionState.update((items) =>
      items.map((item) => (item.id === id ? { ...item, status } : item)),
    );

    return null;
  }
}
