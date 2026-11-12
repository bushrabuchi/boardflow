import { TestBed } from '@angular/core/testing';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MeetingActionStore } from './meeting-action-store';
import { MeetingStore } from './meeting-store';

import {
  TEST_ACTION_INPUT,
  TEST_MEETING,
  makeAction,
  makeMeetingInput,
} from './boardflow-test-data';

const MEETINGS_KEY = 'boardflow.meetings.v1';
const ACTIONS_KEY = 'boardflow.actions.v1';

describe('MeetingActionStore integration', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});

    localStorage.clear();

    localStorage.setItem(MEETINGS_KEY, JSON.stringify([TEST_MEETING]));

    localStorage.setItem(ACTIONS_KEY, '[]');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  it('persists a new action and reloads it', () => {
    const store = TestBed.inject(MeetingActionStore);

    expect(store.create(TEST_MEETING.id, TEST_ACTION_INPUT)).toBeNull();

    const created = store.actions()[0];

    expect(created.title).toBe(TEST_ACTION_INPUT.title);
    expect(created.meetingId).toBe(TEST_MEETING.id);
    expect(created.status).toBe('To do');

    // Recreate services to simulate application startup.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    const reloaded = TestBed.inject(MeetingActionStore);

    expect(reloaded.actions()).toEqual([created]);
  });

  it('preserves identity and creation details when editing', () => {
    localStorage.setItem(ACTIONS_KEY, JSON.stringify([makeAction()]));

    const store = TestBed.inject(MeetingActionStore);
    const before = store.actions()[0];

    expect(
      store.update(before.id, {
        ...TEST_ACTION_INPUT,
        title: 'Updated delivery report',
        description: 'Include the revised delivery date.',
        priority: 'High',
      }),
    ).toBeNull();

    const after = store.actions()[0];

    expect(after.title).toBe('Updated delivery report');
    expect(after.priority).toBe('High');

    expect(after.id).toBe(before.id);
    expect(after.meetingId).toBe(before.meetingId);
    expect(after.createdById).toBe(before.createdById);
    expect(after.createdAt).toBe(before.createdAt);
    expect(after.status).toBe(before.status);

    expect(after.updatedAt).not.toBe(before.updatedAt);
  });

  it('persists status changes across application startup', () => {
    localStorage.setItem(ACTIONS_KEY, JSON.stringify([makeAction()]));

    const store = TestBed.inject(MeetingActionStore);

    expect(store.updateStatus('action-1', 'Completed')).toBeNull();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    const reloaded = TestBed.inject(MeetingActionStore);

    expect(reloaded.actions()[0].status).toBe('Completed');
  });

  it('does not update state when storage rejects a save', () => {
    localStorage.setItem(ACTIONS_KEY, JSON.stringify([makeAction()]));

    const store = TestBed.inject(MeetingActionStore);
    const before = store.actions()[0];
    const storedBefore = localStorage.getItem(ACTIONS_KEY);

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is full', 'QuotaExceededError');
    });

    const error = store.updateStatus(before.id, 'Completed');

    expect(error).not.toBeNull();
    expect(store.actions()[0]).toEqual(before);
    expect(localStorage.getItem(ACTIONS_KEY)).toBe(storedBefore);
  });

  it('rejects owners who are not meeting participants', () => {
    const store = TestBed.inject(MeetingActionStore);

    const error = store.create(TEST_MEETING.id, {
      ...TEST_ACTION_INPUT,
      assigneeId: 'NOT-A-PARTICIPANT',
    });

    expect(error).not.toBeNull();
    expect(store.actions()).toHaveLength(0);
  });

  it('rejects blank titles and impossible dates', () => {
    const store = TestBed.inject(MeetingActionStore);

    expect(
      store.create(TEST_MEETING.id, {
        ...TEST_ACTION_INPUT,
        title: '   ',
      }),
    ).not.toBeNull();

    expect(
      store.create(TEST_MEETING.id, {
        ...TEST_ACTION_INPUT,
        dueDate: '2030-02-31',
      }),
    ).not.toBeNull();

    expect(store.actions()).toHaveLength(0);
  });

  it('migrates older actions without losing their identity', () => {
    const legacyAction = {
      id: 'legacy-action',
      meetingId: TEST_MEETING.id,
      title: 'Legacy task',
      assigneeId: 'NM',
      dueDate: '2030-06-11',
      status: 'To do',
      createdById: 'NM',
      createdAt: '2030-06-01T09:00:00.000Z',
    };

    localStorage.setItem(ACTIONS_KEY, JSON.stringify([legacyAction]));

    const store = TestBed.inject(MeetingActionStore);
    const migrated = store.actions()[0];

    expect(migrated.id).toBe(legacyAction.id);
    expect(migrated.description).toBe('');
    expect(migrated.priority).toBe('Medium');
    expect(migrated.updatedAt).toBe(legacyAction.createdAt);

    expect(JSON.parse(localStorage.getItem(ACTIONS_KEY) ?? '[]')).toEqual([migrated]);
  });

  it('protects unreadable saved actions from being overwritten', () => {
    localStorage.setItem(ACTIONS_KEY, '{broken-json');

    const store = TestBed.inject(MeetingActionStore);

    const error = store.create(TEST_MEETING.id, TEST_ACTION_INPUT);

    expect(error).not.toBeNull();
    expect(localStorage.getItem(ACTIONS_KEY)).toBe('{broken-json');
  });

  it('blocks removing the owner of an unfinished task', () => {
    localStorage.setItem(ACTIONS_KEY, JSON.stringify([makeAction()]));

    const meetings = TestBed.inject(MeetingStore);

    const result = meetings.update(TEST_MEETING.id, makeMeetingInput({ members: [] }));

    expect(result).toBeUndefined();
    expect(meetings.mutationError()).toContain('Reassign or complete');

    expect(meetings.meetings()[0].members).toContain('NM');
  });

  it('blocks action updates for cancelled meetings', () => {
    localStorage.setItem(MEETINGS_KEY, JSON.stringify([{ ...TEST_MEETING, status: 'Cancelled' }]));

    localStorage.setItem(ACTIONS_KEY, JSON.stringify([makeAction()]));

    const store = TestBed.inject(MeetingActionStore);

    expect(store.canCreate(TEST_MEETING.id)).toBe(false);

    expect(store.updateStatus('action-1', 'Completed')).not.toBeNull();

    expect(store.actions()[0].status).toBe('To do');
  });
});
