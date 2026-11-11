export const ACTION_STATUSES = ['To do', 'In progress', 'Completed'] as const;

export type ActionStatus = (typeof ACTION_STATUSES)[number];

export const ACTION_PRIORITIES = ['Low', 'Medium', 'High'] as const;

export type ActionPriority = (typeof ACTION_PRIORITIES)[number];

export interface MeetingAction {
  readonly id: string;
  readonly meetingId: number;
  readonly title: string;
  readonly description: string;
  readonly assigneeId: string;
  readonly dueDate: string;
  readonly priority: ActionPriority;
  readonly status: ActionStatus;
  readonly createdById: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateMeetingActionInput {
  readonly title: string;
  readonly description: string;
  readonly assigneeId: string;
  readonly dueDate: string;
  readonly priority: ActionPriority;
}

export type UpdateMeetingActionInput = CreateMeetingActionInput;

// Older saved actions do not contain these three fields.
export type StoredMeetingAction = Omit<MeetingAction, 'description' | 'priority' | 'updatedAt'> &
  Partial<Pick<MeetingAction, 'description' | 'priority' | 'updatedAt'>>;

export function isDateOnly(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
