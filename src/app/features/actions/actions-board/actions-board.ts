import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  CdkDropListGroup,
} from '@angular/cdk/drag-drop';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { map, timer } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MeetingStore } from '../../meetings/data-access/meeting-store';
import { MeetingActionStore } from '../../meetings/data-access/meeting-action-store';
import { MOCK_MEMBERS } from '../../meetings/data-access/member.mock';
import {
  ACTION_STATUSES,
  ActionStatus,
  MeetingAction,
} from '../../meetings/models/meeting-action.model';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { ActionDialog, ActionDialogData } from '../action-dialog/action-dialog';
interface ActionCard extends MeetingAction {
  readonly meetingTitle: string;
  readonly assigneeName: string;
}

function todayInRiyadh(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '';

  return `${part('year')}-${part('month')}-${part('day')}`;
}

@Component({
  selector: 'app-actions-board',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    CdkDropListGroup,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './actions-board.html',
  styleUrl: './actions-board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionsBoard {
  private readonly meetingStore = inject(MeetingStore);

  readonly actionStore = inject(MeetingActionStore);
  readonly meetings = this.meetingStore.meetings;
  readonly statuses = ACTION_STATUSES;

  readonly search = signal('');
  readonly meetingFilter = signal<number | null>(null);
  readonly assigneeFilter = signal('');
  readonly overdueOnly = signal(false);

  readonly error = signal('');
  readonly message = signal('');

  private readonly boardHeading = viewChild<ElementRef<HTMLHeadingElement>>('boardHeading');

  // Refresh the calendar day while the page remains open.
  private readonly today = toSignal(timer(0, 60_000).pipe(map(() => todayInRiyadh())), {
    initialValue: todayInRiyadh(),
  });
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly canCreateAction = computed(() => {
    if (this.isMeetingScoped()) {
      const meeting = this.scopedMeeting();

      return !!meeting && this.meetingStore.canEdit(meeting);
    }

    return this.meetings().some((meeting) => this.meetingStore.canEdit(meeting));
  });

  openNewAction(): void {
    if (!this.canCreateAction()) {
      return;
    }

    this.error.set('');
    this.message.set('');

    const dialogRef = this.dialog.open<ActionDialog, ActionDialogData, boolean>(ActionDialog, {
      width: '560px',
      maxWidth: '95vw',
      data: {
        meetingId: this.effectiveMeetingId(),
        lockMeeting: this.isMeetingScoped(),
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((saved) => {
        if (!saved) {
          return;
        }

        // Ensure existing filters do not hide the new action.
        this.clearFilters();
        this.message.set('Action created and saved in To do.');
      });
  }
  private readonly memberNames = new Map(MOCK_MEMBERS.map((member) => [member.id, member.name]));

  readonly cards = computed<readonly ActionCard[]>(() => {
    const meetingNames = new Map(this.meetings().map((meeting) => [meeting.id, meeting.title]));

    return this.actionStore.actions().map((action) => ({
      ...action,
      meetingTitle: meetingNames.get(action.meetingId) ?? 'Meeting unavailable',
      assigneeName: this.memberNames.get(action.assigneeId) ?? 'Unknown member',
    }));
  });

  // Include owners of existing actions even if meeting membership changes.
  readonly owners = computed(() => {
    const names = new Map(this.cards().map((action) => [action.assigneeId, action.assigneeName]));

    return Array.from(names, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  });

  readonly filteredCards = computed(() => {
    // An invalid meeting link must not display every meeting's actions.
    if (this.isMeetingScoped() && !this.scopedMeeting()) {
      return [];
    }

    const meetingId = this.effectiveMeetingId();
    const query = this.search().trim().toLowerCase();
    const assigneeId = this.assigneeFilter();
    const onlyOverdue = this.overdueOnly();

    return this.cards()
      .filter((action) => {
        const matchesMeeting = meetingId === null || action.meetingId === meetingId;

        const matchesSearch =
          !query ||
          `${action.title} ${action.meetingTitle} ${action.assigneeName}`
            .toLowerCase()
            .includes(query);

        return (
          matchesMeeting &&
          matchesSearch &&
          (!assigneeId || action.assigneeId === assigneeId) &&
          (!onlyOverdue || this.isOverdue(action))
        );
      })
      .sort(
        (a, b) =>
          a.dueDate.localeCompare(b.dueDate) ||
          a.title.localeCompare(b.title) ||
          a.id.localeCompare(b.id),
      );
  });
  readonly columns = computed(() =>
    this.statuses.map((status) => ({
      status,
      actions: this.filteredCards().filter((action) => action.status === status),
    })),
  );
  readonly summaryStats = computed(() => {
    const actions = this.filteredCards();

    return [
      { label: 'To do', value: actions.filter((action) => action.status === 'To do').length },
      {
        label: 'In progress',
        value: actions.filter((action) => action.status === 'In progress').length,
      },
      {
        label: 'Completed',
        value: actions.filter((action) => action.status === 'Completed').length,
      },
      { label: 'Overdue', value: actions.filter((action) => this.isOverdue(action)).length },
    ];
  });
  readonly hasFilters = computed(
    () =>
      !!this.search().trim() ||
      this.meetingFilter() !== null ||
      !!this.assigneeFilter() ||
      this.overdueOnly(),
  );

  isOverdue(action: MeetingAction): boolean {
    return action.status !== 'Completed' && action.dueDate < this.today();
  }

  clearFilters(): void {
    this.search.set('');
    this.meetingFilter.set(null);
    this.assigneeFilter.set('');
    this.overdueOnly.set(false);
  }

  readonly canEnterColumn = (drag: CdkDrag<ActionCard>): boolean =>
    this.actionStore.canUpdateStatus(drag.data);

  drop(event: CdkDragDrop<ActionStatus, ActionStatus, ActionCard>): void {
    if (!event.isPointerOverContainer || event.previousContainer === event.container) {
      return;
    }

    this.saveStatus(event.item.data, event.container.data);
  }

  selectStatus(action: ActionCard, event: MatSelectChange): void {
    const nextStatus: ActionStatus = event.value;

    // Keep the displayed value unchanged if persistence fails.
    event.source.value = action.status;

    this.saveStatus(action, nextStatus);
  }
  private readonly route = inject(ActivatedRoute);

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  readonly isMeetingScoped = computed(() => this.queryParams().has('meetingId'));

  readonly scopedMeetingId = computed(() => {
    const raw = this.queryParams().get('meetingId');

    if (!raw || !/^[1-9]\d*$/.test(raw)) {
      return null;
    }

    const id = Number(raw);

    return Number.isSafeInteger(id) ? id : null;
  });

  readonly scopedMeeting = computed(() =>
    this.meetings().find((meeting) => meeting.id === this.scopedMeetingId()),
  );

  readonly scopeError = computed(() => {
    if (!this.isMeetingScoped()) {
      return '';
    }

    return this.scopedMeeting() ? '' : 'The requested meeting could not be found.';
  });

  readonly effectiveMeetingId = computed(() =>
    this.isMeetingScoped() ? this.scopedMeetingId() : this.meetingFilter(),
  );
  private saveStatus(action: ActionCard, status: ActionStatus): void {
    this.error.set('');
    this.message.set('');

    if (action.status === status) {
      return;
    }

    const error = this.actionStore.updateStatus(action.id, status);

    if (error !== null) {
      this.error.set(error);
      return;
    }

    // Moving columns recreates the card. Keep keyboard focus predictable.
    this.boardHeading()?.nativeElement.focus();

    this.message.set(`"${action.title}" moved to ${status} and saved.`);
  }
}
