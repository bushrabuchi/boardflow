import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MeetingActions } from './meeting-actions';

describe('MeetingActions', () => {
  let component: MeetingActions;
  let fixture: ComponentFixture<MeetingActions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeetingActions],
    }).compileComponents();

    fixture = TestBed.createComponent(MeetingActions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
