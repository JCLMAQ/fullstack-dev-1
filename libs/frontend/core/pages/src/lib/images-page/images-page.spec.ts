import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImagesPage } from './images-page';

describe('ImagesPage', () => {
  let component: ImagesPage;
  let fixture: ComponentFixture<ImagesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImagesPage],
    }).compileComponents();

    fixture = TestBed.createComponent(ImagesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
