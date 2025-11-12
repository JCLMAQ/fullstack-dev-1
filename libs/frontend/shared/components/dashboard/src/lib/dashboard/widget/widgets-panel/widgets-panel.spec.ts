import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WidgetsPanel } from './widgets-panel';

describe('WidgetsPanel', () => {
  let component: WidgetsPanel;
  let fixture: ComponentFixture<WidgetsPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetsPanel],
    }).compileComponents();

    fixture = TestBed.createComponent(WidgetsPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
