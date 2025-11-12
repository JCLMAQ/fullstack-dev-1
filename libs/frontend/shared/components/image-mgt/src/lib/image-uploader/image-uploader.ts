import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// According: "Custom File Uploader Angular 18"
// https://medium.com/@paul.pietzko/custom-file-uploader-angular-18-ca566131f128
@Component({
  selector: 'lib-image-uploader',
  imports: [
    MatIcon,
    TranslateModule
  ],
  templateUrl: './image-uploader.html',
  styleUrl: './image-uploader.scss',
})
export class ImageUploader {

 private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);


  imageName = signal('');
  fileSize = signal(0);
  uploadProgress = signal(0);
  imagePreview = signal('');
  isDragOver = signal(false);
  readonly fileInput = viewChild<ElementRef>('fileInput');
  selectedFile: File | null = null;
  uploadSuccess = false;
  uploadError = false;


  // Handler for file input change
  onFileChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0] || null;
    this.uploadFile(file);
  }

  // Handler for file drop
  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files[0] as File | null;
    this.uploadFile(file);
  }

  // Prevent default dragover behavior
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  // Handler for drag leave
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  // Method to handle file upload
  uploadFile(file: File | null): void {
    if (file && file.type.startsWith('image/')) {
      this.selectedFile = file;
      this.fileSize.set(Math.round(file.size / 1024)); // Set file size in KB

      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview.set(e.target?.result as string); // Set image preview URL
      };
      reader.readAsDataURL(file);

      this.uploadSuccess = true;
      this.uploadError = false;
      this.imageName.set(file.name); // Set image name
    } else {
      this.uploadSuccess = false;
      this.uploadError = true;
      this.snackBar.open(
        this.translate.instant('Image-uploader.ERROR.ONLY_IMAGES'),
        this.translate.instant('Image-uploader.CLOSE'),
        {
          duration: 3000,
          panelClass: 'error',
        }
      );
    }
  }

  // Method to remove the uploaded image
  removeImage(): void {
    this.selectedFile = null;
    this.imageName.set('');
    this.fileSize.set(0);
    this.imagePreview.set('');
    this.uploadSuccess = false;
    this.uploadError = false;
    this.uploadProgress.set(0);
  }


}
