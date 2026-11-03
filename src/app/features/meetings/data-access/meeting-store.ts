import { Injectable, signal } from '@angular/core';

import { Meeting } from '../models/meeting.model';
import { MOCK_MEETINGS } from './meeting.mock';

@Injectable({
  providedIn: 'root',
})
export class MeetingStore {
  private readonly meetingState =
    signal<readonly Meeting[]>(MOCK_MEETINGS);

  readonly meetings = this.meetingState.asReadonly();
}