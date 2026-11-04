import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MOCK_MEMBERS } from '../data-access/member.mock';
import { MeetingStore } from '../data-access/meeting-store';

@Component({
  selector: 'app-meeting-details',
  standalone: true,
  imports: [DatePipe, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './meeting-details.html',
  styleUrl: './meeting-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeetingDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(MeetingStore);

  private readonly routeId = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))), {
    initialValue: this.route.snapshot.paramMap.get('id'),
  });

  readonly meeting = computed(() => {
    const rawId = this.routeId();

    if (!rawId || !/^[1-9]\d*$/.test(rawId)) {
      return undefined;
    }

    const id = Number(rawId);

    if (!Number.isSafeInteger(id)) {
      return undefined;
    }

    return this.store.meetings().find((item) => item.id === id);
  });
  readonly meetingMembers = computed(() => {
    const meeting = this.meeting();

    if (!meeting) {
      return [];
    }

    return meeting.members.map((id) => {
      const member = MOCK_MEMBERS.find((person) => person.id === id);

      return (
        member ?? {
          id,
          name: 'Member unavailable',
          role: 'Directory information unavailable',
        }
      );
    });
  });
}
