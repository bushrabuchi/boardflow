export type MeetingStatus = 'Draft' | 'In review' | 'Approved';

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
}
export interface CreateMeetingInput {
  readonly title: string;
  readonly committee: string;
  readonly date: string;
  readonly agenda: readonly string[];
  readonly members: readonly string[];
  readonly assigneeId: string;
}
