import { Meeting, MEETING_STATUSES } from '../models/meeting.model';

import { ACTION_STATUSES, MeetingAction } from '../models/meeting-action.model';

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

function isMeetingAction(value: unknown): value is MeetingAction {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value['id'] === 'string' &&
    isCount(value['meetingId']) &&
    value['meetingId'] > 0 &&
    typeof value['title'] === 'string' &&
    typeof value['assigneeId'] === 'string' &&
    typeof value['dueDate'] === 'string' &&
    typeof value['createdById'] === 'string' &&
    typeof value['createdAt'] === 'string' &&
    ACTION_STATUSES.some((status) => status === value['status'])
  );
}

export function isMeetingArray(value: unknown): value is Meeting[] {
  return Array.isArray(value) && value.every(isMeeting);
}

export function isMeetingActionArray(value: unknown): value is MeetingAction[] {
  return Array.isArray(value) && value.every(isMeetingAction);
}
