import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { ImageUploader } from './image-uploader';

describe('ImageUploader', () => {
  let component: ImageUploader;
  let fixture: ComponentFixture<ImageUploader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageUploader],
      providers: [
        {
          provide: MatSnackBar,
          useValue: {
            open: jest.fn()
          }
        },
        {
          provide: TranslateService,
          useValue: {
            instant: jest.fn().mockReturnValue('Test message'),
            get: jest.fn().mockReturnValue(of('Test message')),
            onLangChange: of({}),
            onTranslationChange: of({}),
            onDefaultLangChange: of({})
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ImageUploader);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
