import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActionsBoard } from './actions-board';

describe('ActionsBoard', () => {
  let component: ActionsBoard;
  let fixture: ComponentFixture<ActionsBoard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionsBoard],
    }).compileComponents();

    fixture = TestBed.createComponent(ActionsBoard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
