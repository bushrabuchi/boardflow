import { CreateMeetingInput, Meeting } from '../models/meeting.model';

import { CreateMeetingActionInput, MeetingAction } from '../models/meeting-action.model';

export const TEST_MEETING: Meeting = {
  id: 9001,
  title: 'Phase 4 test meeting',
  committee: 'Technology Committee',
  status: 'Scheduled',
  date: '2030-06-12',
  agendaItems: 1,
  completedActions: 0,
  totalActions: 0,
  members: ['NM'],
  accent: 'purple',
  agenda: ['Review delivery progress'],
  createdById: 'NM',
  assigneeId: 'NM',
  startTime: '10:00',
  endTime: '11:00',
  timeZone: 'Asia/Riyadh',
};

export const TEST_ACTION_INPUT: CreateMeetingActionInput = {
  title: 'Prepare delivery report',
  description: 'Summarise progress and remaining work.',
  assigneeId: 'NM',
  dueDate: '2030-06-11',
  priority: 'Medium',
};

export function makeAction(overrides: Partial<MeetingAction> = {}): MeetingAction {
  return {
    id: 'action-1',
    meetingId: TEST_MEETING.id,
    ...TEST_ACTION_INPUT,
    status: 'To do',
    createdById: 'NM',
    createdAt: '2030-06-01T09:00:00.000Z',
    updatedAt: '2030-06-01T09:00:00.000Z',
    ...overrides,
  };
}

export function makeMeetingInput(overrides: Partial<CreateMeetingInput> = {}): CreateMeetingInput {
  return {
    title: TEST_MEETING.title,
    committee: TEST_MEETING.committee,
    date: TEST_MEETING.date,
    agenda: [...(TEST_MEETING.agenda ?? [])],
    members: [...TEST_MEETING.members],
    status: TEST_MEETING.status,
    assigneeId: 'NM',
    startTime: '10:00',
    endTime: '11:00',
    timeZone: 'Asia/Riyadh',
    ...overrides,
  };
}
