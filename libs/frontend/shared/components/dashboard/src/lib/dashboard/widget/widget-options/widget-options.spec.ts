import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WidgetOptions } from './widget-options';

describe('WidgetOptions', () => {
  let component: WidgetOptions;
  let fixture: ComponentFixture<WidgetOptions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetOptions],
    }).compileComponents();

    fixture = TestBed.createComponent(WidgetOptions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
