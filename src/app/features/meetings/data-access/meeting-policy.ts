import { Meeting } from '../models/meeting.model';

interface MeetingActor {
  readonly id: string;
  readonly role: string;
}

export function canEditMeeting(meeting: Meeting, user: MeetingActor): boolean {
  return (
    user.role === 'Secretary' || meeting.assigneeId === user.id || meeting.createdById === user.id
  );
}
