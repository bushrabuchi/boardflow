export const ACTION_STATUSES = ['To do', 'In progress', 'Completed'] as const;

export type ActionStatus = (typeof ACTION_STATUSES)[number];

export interface MeetingAction {
  readonly id: string;
  readonly meetingId: number;
  readonly title: string;
  readonly assigneeId: string;
  readonly dueDate: string; // YYYY-MM-DD
  readonly status: ActionStatus;
  readonly createdById: string;
  readonly createdAt: string;
}

export interface CreateMeetingActionInput {
  readonly title: string;
  readonly assigneeId: string;
  readonly dueDate: string;
}
