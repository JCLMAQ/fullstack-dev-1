import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WidgetHeader } from './widget-header';

describe('WidgetHeader', () => {
  let component: WidgetHeader;
  let fixture: ComponentFixture<WidgetHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetHeader],
    }).compileComponents();

    fixture = TestBed.createComponent(WidgetHeader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
