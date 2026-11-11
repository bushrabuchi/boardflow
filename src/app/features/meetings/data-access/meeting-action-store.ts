import { Injectable, inject } from '@angular/core';

import { CurrentUserService } from '../../../core/current-user.service';

import {
  ACTION_PRIORITIES,
  ACTION_STATUSES,
  ActionStatus,
  CreateMeetingActionInput,
  MeetingAction,
  UpdateMeetingActionInput,
  isDateOnly,
} from '../models/meeting-action.model';

import { ActionDataStore } from '././action-data-store';
import { MeetingStore } from './meeting-store';

@Injectable({ providedIn: 'root' })
export class MeetingActionStore {
  private readonly data = inject(ActionDataStore);
  private readonly meetingStore = inject(MeetingStore);
  private readonly currentUser = inject(CurrentUserService);

  readonly actions = this.data.actions;
  readonly storageError = this.data.storageError;

  canCreate(meetingId: number): boolean {
    const meeting = this.meetingStore.meetings().find((item) => item.id === meetingId);

    return !!meeting && meeting.status !== 'Cancelled' && this.meetingStore.canEdit(meeting);
  }

  canEdit(action: MeetingAction): boolean {
    return this.canCreate(action.meetingId);
  }

  canUpdateStatus(action: MeetingAction): boolean {
    const meeting = this.meetingStore.meetings().find((item) => item.id === action.meetingId);

    if (!meeting || meeting.status === 'Cancelled') {
      return false;
    }

    const isAssignedParticipant =
      action.assigneeId === this.currentUser.user().id &&
      meeting.members.includes(action.assigneeId);

    return this.canEdit(action) || isAssignedParticipant;
  }

  private validate(meetingId: number, input: CreateMeetingActionInput): string | null {
    const meeting = this.meetingStore.meetings().find((item) => item.id === meetingId);

    if (!meeting) {
      return 'The selected meeting could not be found.';
    }

    if (!this.canCreate(meetingId)) {
      return 'You do not have permission to manage actions for this meeting.';
    }

    if (!input.title.trim() || input.title.length > 200) {
      return 'Enter a title of 1–200 characters.';
    }

    if (input.description.length > 2000) {
      return 'Use 2,000 characters or fewer for the description.';
    }

    if (!meeting.members.includes(input.assigneeId)) {
      return 'Choose a participant from the selected meeting.';
    }

    if (!isDateOnly(input.dueDate)) {
      return 'Choose a valid due date.';
    }

    if (!ACTION_PRIORITIES.includes(input.priority)) {
      return 'Choose a valid priority.';
    }

    return null;
  }

  create(meetingId: number, input: CreateMeetingActionInput): string | null {
    const error = this.validate(meetingId, input);

    if (error !== null) {
      return error;
    }

    const now = new Date().toISOString();

    const action: MeetingAction = {
      id: crypto.randomUUID(),
      meetingId,
      title: input.title.trim(),
      description: input.description.trim(),
      assigneeId: input.assigneeId,
      dueDate: input.dueDate,
      priority: input.priority,
      status: 'To do',
      createdById: this.currentUser.user().id,
      createdAt: now,
      updatedAt: now,
    };

    return this.data.save([...this.actions(), action]);
  }

  update(id: string, input: UpdateMeetingActionInput): string | null {
    const existing = this.actions().find((item) => item.id === id);

    if (!existing) {
      return 'This action could not be found.';
    }

    const error = this.validate(existing.meetingId, input);

    if (error !== null) {
      return error;
    }

    // Explicitly update editable fields.
    // Preserve id, meetingId, createdById, createdAt and status.
    const updated: MeetingAction = {
      ...existing,
      title: input.title.trim(),
      description: input.description.trim(),
      assigneeId: input.assigneeId,
      dueDate: input.dueDate,
      priority: input.priority,
      updatedAt: new Date().toISOString(),
    };

    return this.data.save(this.actions().map((item) => (item.id === id ? updated : item)));
  }

  updateStatus(id: string, status: ActionStatus): string | null {
    const action = this.actions().find((item) => item.id === id);

    if (!action) {
      return 'This action could not be found.';
    }

    if (!this.canUpdateStatus(action)) {
      return 'You do not have permission to update this action.';
    }

    if (!ACTION_STATUSES.includes(status)) {
      return 'Choose a valid action status.';
    }

    if (action.status === status) {
      return null;
    }

    return this.data.save(
      this.actions().map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    );
  }
}
