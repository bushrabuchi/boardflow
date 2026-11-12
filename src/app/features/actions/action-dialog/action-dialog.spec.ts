import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ActionDialog } from './action-dialog';

describe('ActionDialog', () => {
  let component: ActionDialog;
  let fixture: ComponentFixture<ActionDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { meetingId: null, lockMeeting: false } },
        { provide: MatDialogRef, useValue: { close: () => undefined } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ActionDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
