import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FieldError } from './field-error';

describe('FieldError', () => {
  let component: FieldError;
  let fixture: ComponentFixture<FieldError>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FieldError],
    }).compileComponents();

    fixture = TestBed.createComponent(FieldError);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
