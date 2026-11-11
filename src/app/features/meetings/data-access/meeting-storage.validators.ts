import { Meeting, MEETING_STATUSES } from '../models/meeting.model';

import {
  ACTION_PRIORITIES,
  ACTION_STATUSES,
  MeetingAction,
  StoredMeetingAction,
  isDateOnly,
} from '../models/meeting-action.model';
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isMeeting(value: unknown): value is Meeting {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isCount(value['id']) &&
    value['id'] > 0 &&
    typeof value['title'] === 'string' &&
    typeof value['committee'] === 'string' &&
    typeof value['date'] === 'string' &&
    MEETING_STATUSES.some((status) => status === value['status']) &&
    isStringArray(value['members']) &&
    isCount(value['agendaItems']) &&
    isCount(value['completedActions']) &&
    isCount(value['totalActions']) &&
    ['purple', 'blue', 'rose'].includes(String(value['accent'])) &&
    (value['agenda'] === undefined || isStringArray(value['agenda'])) &&
    ['createdById', 'assigneeId', 'startTime', 'endTime'].every(
      (key) => value[key] === undefined || typeof value[key] === 'string',
    ) &&
    (value['timeZone'] === undefined || value['timeZone'] === 'Asia/Riyadh')
  );
}
function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function isStoredMeetingAction(value: unknown): value is StoredMeetingAction {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value['id'] === 'string' &&
    value['id'].length > 0 &&
    isCount(value['meetingId']) &&
    value['meetingId'] > 0 &&
    typeof value['title'] === 'string' &&
    typeof value['assigneeId'] === 'string' &&
    isDateOnly(value['dueDate']) &&
    typeof value['createdById'] === 'string' &&
    isTimestamp(value['createdAt']) &&
    ACTION_STATUSES.some((status) => status === value['status']) &&
    (value['description'] === undefined || typeof value['description'] === 'string') &&
    (value['priority'] === undefined ||
      ACTION_PRIORITIES.some((priority) => priority === value['priority'])) &&
    (value['updatedAt'] === undefined || isTimestamp(value['updatedAt']))
  );
}

export function isStoredActionArray(value: unknown): value is StoredMeetingAction[] {
  if (!Array.isArray(value) || !value.every(isStoredMeetingAction)) {
    return false;
  }

  return new Set(value.map((item) => item.id)).size === value.length;
}

export function isMeetingActionArray(value: unknown): value is MeetingAction[] {
  return (
    isStoredActionArray(value) &&
    value.every(
      (item) =>
        item.description !== undefined &&
        item.priority !== undefined &&
        item.updatedAt !== undefined,
    )
  );
}
export function isMeetingArray(value: unknown): value is Meeting[] {
  return Array.isArray(value) && value.every(isMeeting);
}
