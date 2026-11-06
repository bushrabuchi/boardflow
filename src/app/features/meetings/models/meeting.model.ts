export type MeetingStatus =
  'Draft' | 'Scheduled' | 'In progress' | 'In review' | 'Completed' | 'Cancelled';

export const MEETING_STATUSES: readonly MeetingStatus[] = [
  'Draft',
  'Scheduled',
  'In progress',
  'In review',
  'Completed',
  'Cancelled',
];
export interface Meeting {
  readonly id: number;
  readonly title: string;
  readonly committee: string;
  readonly status: MeetingStatus;
  readonly date: string;
  readonly agendaItems: number;
  readonly completedActions: number;
  readonly totalActions: number;
  readonly members: readonly string[];
  readonly accent: 'purple' | 'blue' | 'rose';
  readonly agenda?: readonly string[];
  readonly createdById?: string;
  readonly assigneeId?: string;
  readonly startTime?: string;
  readonly endTime?: string;
  readonly timeZone?: 'Asia/Riyadh';
}
export interface CreateMeetingInput {
  readonly title: string;
  readonly committee: string;
  readonly date: string;
  readonly agenda: readonly string[];
  readonly members: readonly string[];
  readonly status: MeetingStatus;
  readonly assigneeId: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly timeZone: 'Asia/Riyadh';
}
